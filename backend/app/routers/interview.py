import time

from fastapi import APIRouter, HTTPException

from app import store
from app.evaluator import evaluate_submission
from app.judge0_client import Judge0Error, run_against_test_cases
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
    first_question = session["questions"][0]
    return StartInterviewResponse(
        session_id=session["session_id"],
        candidate_name=session["candidate_name"],
        total_questions=len(session["questions"]),
        question=_to_public_question(first_question, 0, len(session["questions"])),
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

    idx = session["current_index"]
    if idx >= len(session["questions"]):
        raise HTTPException(400, "Interview already complete.")

    question = session["questions"][idx]

    try:
        run_result = await run_against_test_cases(
            candidate_code=req.code,
            function_name=question["function_name"],
            test_cases=question["test_cases"],
            language=req.language,
        )
    except Judge0Error as e:
        raise HTTPException(502, f"Code execution service error: {e}")

    eval_dict = await evaluate_submission(question, req.code, run_result)
    evaluation = QuestionEvaluation(**eval_dict)

    session["evaluations"].append(eval_dict)
    session["current_index"] += 1

    is_last = session["current_index"] >= len(session["questions"])
    next_question = None
    if not is_last:
        nxt = session["questions"][session["current_index"]]
        next_question = _to_public_question(nxt, session["current_index"], len(session["questions"]))

    return SubmitCodeResponse(evaluation=evaluation, is_last_question=is_last, next_question=next_question)


@router.get("/{session_id}/report", response_model=ReportResponse)
def get_report(session_id: str):
    session = store.get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    evaluations = session["evaluations"]
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
