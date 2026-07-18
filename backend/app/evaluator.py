"""
Turns (question, candidate code, test-execution results) into a scored,
structured evaluation. Uses Claude to judge *approach* and *complexity* --
things a simple diff against the optimal solution can't fairly capture,
since two correct solutions can look completely different.

If no ANTHROPIC_API_KEY is set, falls back to a heuristic (test pass rate
only) so the rest of the app still works end to end during setup.
"""
import json
import re
from typing import Optional

from anthropic import AsyncAnthropic

from app.config import settings

_client: Optional[AsyncAnthropic] = None


def _get_client() -> Optional[AsyncAnthropic]:
    global _client
    if not settings.ANTHROPIC_API_KEY:
        return None
    if _client is None:
        _client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


EVAL_SYSTEM_PROMPT = """You are a strict but fair technical interviewer grading a candidate's \
solution to a DSA (data structures & algorithms) interview question. You are given the problem, \
the candidate's code, the reference optimal solution (for your reference only, NOT as a template \
the candidate had to match verbatim), and the results of running the candidate's code against \
real test cases.

Grade holistically:
- Correctness (did it pass the test cases) matters most.
- Efficiency: does the candidate's approach match the optimal time/space complexity, or is it a \
brute-force / suboptimal approach that happens to pass on small inputs?
- Code quality: readability, sensible naming, handling of edge cases.

Do NOT penalize a solution for using different variable names, a different but equally valid \
data structure, or different code style than the optimal solution -- only penalize genuine \
correctness or efficiency gaps.

Respond with ONLY a JSON object (no markdown fences, no prose outside the JSON) matching exactly \
this schema:
{
  "correctness_score": <0-100 int>,
  "efficiency_score": <0-100 int>,
  "code_quality_score": <0-100 int>,
  "detected_approach": "<one short sentence describing the technique the candidate actually used>",
  "detected_time_complexity": "<e.g. O(n^2)>",
  "detected_space_complexity": "<e.g. O(1)>",
  "strengths": ["<short bullet>", "..."],
  "missed_points": ["<short bullet describing a concrete gap vs the optimal approach, if any>", "..."],
  "feedback": "<2-4 sentences of direct, constructive interviewer feedback addressed to the candidate>"
}
"""


def _heuristic_evaluation(question: dict, tests_passed: int, tests_total: int) -> dict:
    pass_rate = (tests_passed / tests_total) if tests_total else 0
    correctness = round(pass_rate * 100)
    return {
        "correctness_score": correctness,
        "efficiency_score": correctness,  # can't judge efficiency without an LLM
        "code_quality_score": 70,
        "detected_approach": "Not evaluated (ANTHROPIC_API_KEY not configured)",
        "detected_time_complexity": "Unknown",
        "detected_space_complexity": "Unknown",
        "strengths": (["Passed all visible test cases."] if pass_rate == 1 else []),
        "missed_points": (
            [] if pass_rate == 1 else [f"Failed {tests_total - tests_passed} of {tests_total} test cases."]
        ),
        "feedback": (
            "Set ANTHROPIC_API_KEY in the backend .env to get real interviewer-style feedback on "
            "approach and complexity. For now this score reflects test-case pass rate only."
        ),
    }


def _extract_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(json)?|```$", "", text, flags=re.MULTILINE).strip()
    return json.loads(text)


async def evaluate_submission(question: dict, candidate_code: str, run_result: dict) -> dict:
    results = run_result.get("results", [])
    tests_total = len(question["test_cases"])
    tests_passed = sum(1 for r in results if r.get("passed"))

    client = _get_client()
    if client is None:
        llm_eval = _heuristic_evaluation(question, tests_passed, tests_total)
    else:
        user_prompt = json.dumps(
            {
                "problem_title": question["title"],
                "problem_prompt": question["prompt"],
                "candidate_code": candidate_code,
                "optimal_solution": question["optimal_solution"],
                "optimal_time_complexity": question["optimal_time_complexity"],
                "optimal_space_complexity": question["optimal_space_complexity"],
                "optimal_approach": question["optimal_approach"],
                "test_run_results": results,
                "judge0_stderr": run_result.get("stderr"),
                "judge0_compile_error": run_result.get("compile_error"),
                "judge0_status": run_result.get("status"),
            }
        )
        response = await client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=1024,
            system=EVAL_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
        text = "".join(block.text for block in response.content if block.type == "text")
        try:
            llm_eval = _extract_json(text)
        except (json.JSONDecodeError, AttributeError):
            llm_eval = _heuristic_evaluation(question, tests_passed, tests_total)
            llm_eval["feedback"] = "Evaluator returned an unparseable response; showing pass-rate score instead."

    correctness = int(llm_eval.get("correctness_score", 0))
    efficiency = int(llm_eval.get("efficiency_score", 0))
    quality = int(llm_eval.get("code_quality_score", 0))
    # Weighted overall: correctness matters most in a real interview.
    overall = round(correctness * 0.5 + efficiency * 0.3 + quality * 0.2)

    return {
        "question_id": question["id"],
        "title": question["title"],
        "score": overall,
        "correctness_score": correctness,
        "efficiency_score": efficiency,
        "code_quality_score": quality,
        "tests_passed": tests_passed,
        "tests_total": tests_total,
        "detected_approach": llm_eval.get("detected_approach", "Unknown"),
        "detected_time_complexity": llm_eval.get("detected_time_complexity", "Unknown"),
        "detected_space_complexity": llm_eval.get("detected_space_complexity", "Unknown"),
        "optimal_approach": question["optimal_approach"],
        "optimal_time_complexity": question["optimal_time_complexity"],
        "optimal_space_complexity": question["optimal_space_complexity"],
        "strengths": llm_eval.get("strengths", []),
        "missed_points": llm_eval.get("missed_points", []),
        "feedback": llm_eval.get("feedback", ""),
    }
