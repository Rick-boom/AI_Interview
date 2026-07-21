"""
Turns (question, candidate code, test-execution results, verbal explanation, telemetry)
into a scored, structured evaluation. Uses Gemini to judge *approach* and *complexity* --
things a simple diff against the optimal solution can't fairly capture,
since two correct solutions can look completely different.

Research Project: Multimodal Automated Technical Assessment
Hypothesis: Code + Verbal Explanation + Telemetry increases grading reliability,
            detects algorithmic bluffing, and reduces evaluator bias vs code-only.

If no GEMINI_API_KEY is set, falls back to a heuristic (test pass rate
only) so the rest of the app still works end to end during setup.
"""
import json
import re
from typing import Optional

from google import genai
from google.genai import types

from app.config import settings

_client: Optional[genai.Client] = None


def _get_client() -> Optional[genai.Client]:
    global _client
    if not settings.GEMINI_API_KEY:
        return None
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


# ─── Code-Only System Prompt (baseline / backward compat) ─────────────────────

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

# ─── Multimodal Research System Prompt ────────────────────────────────────────

MULTIMODAL_EVAL_SYSTEM_PROMPT = """You are an AI Technical Interview Grader participating in an \
academic research study on Multimodal Automated Technical Assessment.

You must evaluate a candidate based on BOTH their written source code AND their transcribed verbal \
explanation of their approach. You also receive cognitive load telemetry (compilation retries, \
paste events) as contextual signals.

Grade holistically across these dimensions:
1. CORRECTNESS: Did the code pass the test cases? (most important)
2. EFFICIENCY: Does the approach match the optimal time/space complexity?
3. CODE QUALITY: Readability, naming, edge-case handling.
4. VERBAL CLARITY (0-100): How clearly did the candidate articulate their algorithm, time \
complexity, and trade-offs? Score 0 if no explanation provided.
5. ALIGNMENT SCORE (0-100): Does the verbal explanation accurately describe what the code \
actually does? A mismatch = "algorithmic bluffing". \
Key rule: If the candidate verbally claims O(N) or O(log N) but the code implements a nested \
loop (O(N²)), the alignment score must be ≤ 40 and bluffing_detected must be true.
6. BIAS AUDIT: Set bias_audit_passed=true if your score is based strictly on code logic and \
correctness, ignoring stylistic differences, accent/grammar errors in the transcript, or \
non-idiomatic variable names.

Do NOT penalize different-but-equally-valid approaches. Only penalize genuine correctness or \
efficiency gaps.

Respond with ONLY a JSON object (no markdown fences, no prose) matching EXACTLY this schema:
{
  "correctness_score": <0-100 int>,
  "efficiency_score": <0-100 int>,
  "code_quality_score": <0-100 int>,
  "detected_approach": "<one short sentence>",
  "detected_time_complexity": "<e.g. O(n^2)>",
  "detected_space_complexity": "<e.g. O(1)>",
  "strengths": ["<short bullet>", "..."],
  "missed_points": ["<short bullet>", "..."],
  "feedback": "<2-4 sentences of direct, constructive interviewer feedback>",
  "verbal_clarity_score": <0-100 int>,
  "alignment_score": <0-100 int>,
  "bluffing_detected": <true|false>,
  "confidence_percentage": <0-100 int>,
  "bias_audit_passed": <true|false>,
  "verbal_explanation_summary": "<1 sentence summarising what the candidate said, or 'No explanation provided.'>"
}
"""


def _heuristic_evaluation(question: dict, tests_passed: int, tests_total: int) -> dict:
    pass_rate = (tests_passed / tests_total) if tests_total else 0
    correctness = round(pass_rate * 100)
    return {
        "correctness_score": correctness,
        "efficiency_score": correctness,  # can't judge efficiency without an LLM
        "code_quality_score": 70,
        "detected_approach": "Not evaluated (GEMINI_API_KEY not configured)",
        "detected_time_complexity": "Unknown",
        "detected_space_complexity": "Unknown",
        "strengths": (["Passed all visible test cases."] if pass_rate == 1 else []),
        "missed_points": (
            [] if pass_rate == 1 else [f"Failed {tests_total - tests_passed} of {tests_total} test cases."]
        ),
        "feedback": (
            "Set GEMINI_API_KEY in the backend .env to get real interviewer-style feedback on "
            "approach and complexity. For now this score reflects test-case pass rate only."
        ),
    }


def _extract_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(json)?|```$", "", text, flags=re.MULTILINE).strip()
    return json.loads(text)


async def evaluate_submission(
    question: dict,
    candidate_code: str,
    run_result: dict,
    verbal_explanation: Optional[str] = None,
    telemetry: Optional[dict] = None,
) -> dict:
    """
    Evaluate a candidate submission.

    Parameters
    ----------
    question           : Full question dict (from store, including optimal solution).
    candidate_code     : The candidate's source code.
    run_result         : Output from Piston (test results, stderr, status).
    verbal_explanation : Transcribed voice explanation from the frontend (optional).
    telemetry          : Cognitive load signals dict (optional).
                         Keys: compilation_retries, paste_count, time_to_first_compile.

    Returns
    -------
    dict matching the QuestionEvaluation schema fields.
    """
    results = run_result.get("results", [])
    tests_total = len(question["test_cases"])
    tests_passed = sum(1 for r in results if r.get("passed"))

    has_verbal = bool(verbal_explanation and verbal_explanation.strip()
                      and verbal_explanation.strip() != "No verbal explanation provided.")
    tel = telemetry or {}

    client = _get_client()
    if client is None:
        llm_eval = _heuristic_evaluation(question, tests_passed, tests_total)
    else:
        # ── Select prompt mode based on whether verbal explanation exists ──
        if has_verbal:
            system_prompt = MULTIMODAL_EVAL_SYSTEM_PROMPT
            user_content = json.dumps({
                "problem_title":             question["title"],
                "problem_prompt":            question["prompt"],
                "candidate_code":            candidate_code,
                "optimal_solution":          question["optimal_solution"],
                "optimal_time_complexity":   question["optimal_time_complexity"],
                "optimal_space_complexity":  question["optimal_space_complexity"],
                "optimal_approach":          question["optimal_approach"],
                "test_run_results":          results,
                "piston_stderr":             run_result.get("stderr"),
                "piston_compile_error":      run_result.get("compile_error"),
                "piston_status":             run_result.get("status"),
                # ── Research inputs ──
                "verbal_explanation":        verbal_explanation,
                "telemetry": {
                    "compilation_retries":    tel.get("compilation_retries", 0),
                    "paste_count":            tel.get("paste_count", 0),
                    "time_to_first_compile":  tel.get("time_to_first_compile"),
                },
            })
        else:
            # Code-only path — backward compatible, cheaper prompt
            system_prompt = EVAL_SYSTEM_PROMPT
            user_content = json.dumps({
                "problem_title":             question["title"],
                "problem_prompt":            question["prompt"],
                "candidate_code":            candidate_code,
                "optimal_solution":          question["optimal_solution"],
                "optimal_time_complexity":   question["optimal_time_complexity"],
                "optimal_space_complexity":  question["optimal_space_complexity"],
                "optimal_approach":          question["optimal_approach"],
                "test_run_results":          results,
                "piston_stderr":             run_result.get("stderr"),
                "piston_compile_error":      run_result.get("compile_error"),
                "piston_status":             run_result.get("status"),
            })

        try:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=user_content,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    max_output_tokens=1500,
                    temperature=0.2,
                ),
            )
            text = response.text or ""
            llm_eval = _extract_json(text)
        except Exception as e:
            llm_eval = _heuristic_evaluation(question, tests_passed, tests_total)
            llm_eval["feedback"] = f"AI Evaluation failed ({e.__class__.__name__}: {str(e)}). Showing pass-rate score instead."

    # ── Compute weighted overall score ─────────────────────────────────────────
    correctness = int(llm_eval.get("correctness_score", 0))
    efficiency  = int(llm_eval.get("efficiency_score",  0))
    quality     = int(llm_eval.get("code_quality_score", 0))
    # Weighted overall: correctness matters most in a real interview.
    overall = round(correctness * 0.5 + efficiency * 0.3 + quality * 0.2)

    # ── Assemble result dict (superset of QuestionEvaluation fields) ───────────
    result = {
        "question_id":               question["id"],
        "title":                     question["title"],
        "score":                     overall,
        "correctness_score":         correctness,
        "efficiency_score":          efficiency,
        "code_quality_score":        quality,
        "tests_passed":              tests_passed,
        "tests_total":               tests_total,
        "detected_approach":         llm_eval.get("detected_approach",        "Unknown"),
        "detected_time_complexity":  llm_eval.get("detected_time_complexity", "Unknown"),
        "detected_space_complexity": llm_eval.get("detected_space_complexity","Unknown"),
        "optimal_approach":          question["optimal_approach"],
        "optimal_time_complexity":   question["optimal_time_complexity"],
        "optimal_space_complexity":  question["optimal_space_complexity"],
        "strengths":                 llm_eval.get("strengths",     []),
        "missed_points":             llm_eval.get("missed_points", []),
        "feedback":                  llm_eval.get("feedback",      ""),
        # XAI / Research metrics (present only when verbal explanation was supplied)
        "verbal_clarity_score":       llm_eval.get("verbal_clarity_score"),
        "alignment_score":            llm_eval.get("alignment_score"),
        "bluffing_detected":          llm_eval.get("bluffing_detected"),
        "confidence_percentage":      llm_eval.get("confidence_percentage"),
        "bias_audit_passed":          llm_eval.get("bias_audit_passed"),
        "verbal_explanation_summary": llm_eval.get("verbal_explanation_summary"),
    }

    return result
