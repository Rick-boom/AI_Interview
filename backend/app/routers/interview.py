import csv
import time
import uuid
from datetime import datetime, timezone
from io import StringIO

from fastapi import APIRouter, HTTPException, Response

from app import store
from app.evaluator import evaluate_submission
from app.piston_client import CodeExecutionError, run_against_test_cases
from app.schemas import (
    PublicQuestion,
    QuestionEvaluation,
    ReportResponse,
    StartInterviewRequest,
    StartInterviewResponse,
    SubmitCodeRequest,
    SubmitCodeResponse,
)

router = APIRouter(prefix="/api/interview", tags=["interview"])


def _to_public_question(question: dict, index: int, total: int) -> PublicQuestion:
    """Strips test cases / optimal solution before sending to the client."""
    return PublicQuestion(
        id=question["id"],
        index=index,
        total=total,
        title=question["title"],
        difficulty=question["difficulty"],
        topic=question["topic"],
        company_tags=question["company_tags"],
        prompt=question["prompt"],
        constraints=question["constraints"],
        starter_code=question["starter_code"],
    )


@router.post("/start", response_model=StartInterviewResponse)
def start_interview(req: StartInterviewRequest):
    if req.num_questions < 1 or req.num_questions > 10:
        raise HTTPException(400, "num_questions must be between 1 and 10")

    session = store.create_session(req.candidate_name, req.num_questions, req.difficulty, req.topic)
    questions = [_to_public_question(q, i, len(session["questions"])) for i, q in enumerate(session["questions"])]
    return StartInterviewResponse(
        session_id=session["session_id"],
        candidate_name=session["candidate_name"],
        total_questions=len(session["questions"]),
        questions=questions,
    )


@router.get("/{session_id}/current", response_model=PublicQuestion)
def get_current_question(session_id: str):
    session = store.get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    idx = session["current_index"]
    if idx >= len(session["questions"]):
        raise HTTPException(400, "Interview already complete. Fetch the report instead.")
    return _to_public_question(session["questions"][idx], idx, len(session["questions"]))


@router.post("/{session_id}/submit", response_model=SubmitCodeResponse)
async def submit_code(session_id: str, req: SubmitCodeRequest):
    session = store.get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    question = next((q for q in session["questions"] if q["id"] == req.question_id), None)
    if not question:
        raise HTTPException(404, "Question not found in session.")

    try:
        run_result = await run_against_test_cases(
            candidate_code=req.code,
            function_name=question["function_name"],
            test_cases=question["test_cases"],
            language=req.language,
            question=question
        )
    except CodeExecutionError as e:
        raise HTTPException(502, f"Code execution service error: {e}")

    # ── Resolve telemetry to a plain dict for the evaluator ──────────────────
    tel_dict = {
        "compilation_retries":   req.telemetry.compilation_retries,
        "paste_count":           req.telemetry.paste_count,
        "time_to_first_compile": req.telemetry.time_to_first_compile,
    }

    # ── Multimodal evaluation (passes verbal + telemetry to Gemini) ──────────
    eval_dict = await evaluate_submission(
        question=question,
        candidate_code=req.code,
        run_result=run_result,
        verbal_explanation=req.verbal_explanation,
        telemetry=tel_dict,
    )

    evaluation = QuestionEvaluation(**eval_dict)

    # ── Persist evaluation + research metadata to the session ────────────────
    session_eval_record = {
        **eval_dict,
        "_submission_id":     str(uuid.uuid4()),
        "_language":          req.language,
        "_time_taken_seconds": req.time_taken_seconds,
        "_telemetry":         tel_dict,
        "_has_verbal":        bool(
            req.verbal_explanation
            and req.verbal_explanation.strip()
            and req.verbal_explanation.strip() != "No verbal explanation provided."
        ),
        "_timestamp":         datetime.now(timezone.utc).isoformat(),
    }
    session["evaluations"].append(session_eval_record)

    return SubmitCodeResponse(evaluation=evaluation)


@router.get("/{session_id}/report", response_model=ReportResponse)
def get_report(session_id: str):
    session = store.get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    # Deduplicate evaluations, keeping the latest for each question
    latest_evals = {}
    for e in session["evaluations"]:
        latest_evals[e["question_id"]] = e
    evaluations = list(latest_evals.values())

    if not evaluations:
        raise HTTPException(400, "No questions answered yet.")

    overall = round(sum(e["score"] for e in evaluations) / len(evaluations))
    duration = int(time.time() - session["started_at"])

    if overall >= 85:
        summary = "Strong performance — consistently correct, efficient solutions. Ready for real interviews at this difficulty level."
    elif overall >= 65:
        summary = "Solid foundation with some gaps in efficiency or edge-case handling. A bit more practice on optimal approaches will help."
    elif overall >= 40:
        summary = "Core concepts need more practice — several questions were incomplete or used suboptimal approaches. Focus on the topics flagged below."
    else:
        summary = "Significant gaps across most questions. Recommend revisiting fundamentals for the topics covered before the next mock interview."

    return ReportResponse(
        session_id=session_id,
        candidate_name=session["candidate_name"],
        overall_score=overall,
        total_questions=len(session["questions"]),
        questions_answered=len(evaluations),
        duration_seconds=duration,
        evaluations=[QuestionEvaluation(**e) for e in evaluations],
        summary=summary,
    )


# ─── Research Data CSV Export ──────────────────────────────────────────────────

_CSV_HEADERS = [
    "submission_id",
    "session_id",
    "candidate_name",
    "question_id",
    "question_title",
    "difficulty",
    "language",
    "overall_score",
    "correctness_score",
    "efficiency_score",
    "code_quality_score",
    "verbal_clarity_score",
    "alignment_score",
    "bluffing_detected",
    "confidence_percentage",
    "bias_audit_passed",
    "tests_passed",
    "tests_total",
    "time_to_first_compile_s",
    "compilation_retries",
    "paste_count",
    "time_taken_seconds",
    "has_verbal_explanation",
    "timestamp",
]


@router.get("/export-research-data")
def export_research_data():
    """
    Export all session evaluation data as a CSV file ready for research analysis.

    Each row represents one question submission (latest per question per session).
    Maps to the ResearchRecord schema. Download via:
        GET /api/interview/export-research-data
    """
    sessions = store.get_all_sessions()

    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=_CSV_HEADERS, extrasaction="ignore")
    writer.writeheader()

    for session in sessions:
        # Deduplicate: latest submission per question
        latest_evals: dict[str, dict] = {}
        for e in session.get("evaluations", []):
            latest_evals[e["question_id"]] = e

        # Find difficulty for each question from session's question list
        diff_lookup = {q["id"]: q.get("difficulty", "Unknown") for q in session.get("questions", [])}

        for qid, ev in latest_evals.items():
            tel = ev.get("_telemetry") or {}
            writer.writerow({
                "submission_id":          ev.get("_submission_id", ""),
                "session_id":             session["session_id"],
                "candidate_name":         session["candidate_name"],
                "question_id":            qid,
                "question_title":         ev.get("title", ""),
                "difficulty":             diff_lookup.get(qid, "Unknown"),
                "language":               ev.get("_language", ""),
                "overall_score":          ev.get("score", 0),
                "correctness_score":      ev.get("correctness_score", 0),
                "efficiency_score":       ev.get("efficiency_score", 0),
                "code_quality_score":     ev.get("code_quality_score", 0),
                "verbal_clarity_score":   ev.get("verbal_clarity_score", ""),
                "alignment_score":        ev.get("alignment_score", ""),
                "bluffing_detected":      ev.get("bluffing_detected", ""),
                "confidence_percentage":  ev.get("confidence_percentage", ""),
                "bias_audit_passed":      ev.get("bias_audit_passed", ""),
                "tests_passed":           ev.get("tests_passed", 0),
                "tests_total":            ev.get("tests_total", 0),
                "time_to_first_compile_s": tel.get("time_to_first_compile", ""),
                "compilation_retries":    tel.get("compilation_retries", 0),
                "paste_count":            tel.get("paste_count", 0),
                "time_taken_seconds":     ev.get("_time_taken_seconds", ""),
                "has_verbal_explanation": ev.get("_has_verbal", False),
                "timestamp":              ev.get("_timestamp", ""),
            })

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=interview_research_data.csv",
            "Cache-Control": "no-cache",
        },
    )
