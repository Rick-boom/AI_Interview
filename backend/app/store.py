"""
Very small in-memory store, good enough for a mock-interview MVP / demo.

Swap this out for Redis or a real DB table (sessions, evaluations) once the
team wires this into the main placement-portal backend — the interface
(get/create/update) is deliberately tiny so that swap is a small diff.
"""
import json
import random
import time
import uuid
from pathlib import Path
from typing import Optional

QUESTIONS_PATH = Path(__file__).parent / "data" / "questions.json"
with open(QUESTIONS_PATH) as f:
    ALL_QUESTIONS: list[dict] = json.load(f)

_QUESTIONS_BY_ID = {q["id"]: q for q in ALL_QUESTIONS}

# session_id -> session dict
_SESSIONS: dict[str, dict] = {}


def pick_questions(num_questions: int, difficulty: Optional[str], topic: Optional[str]) -> list[dict]:
    pool = ALL_QUESTIONS
    if difficulty:
        pool = [q for q in pool if q["difficulty"].lower() == difficulty.lower()]
    if topic:
        pool = [q for q in pool if topic.lower() in q["topic"].lower()]
    if not pool:
        pool = ALL_QUESTIONS
    pool = pool.copy()
    random.shuffle(pool)
    return pool[: min(num_questions, len(pool))]


def create_session(candidate_name: str, num_questions: int, difficulty: Optional[str], topic: Optional[str]) -> dict:
    session_id = str(uuid.uuid4())
    questions = pick_questions(num_questions, difficulty, topic)
    session = {
        "session_id": session_id,
        "candidate_name": candidate_name,
        "questions": questions,  # ordered list of full question dicts (server-side only)
        "current_index": 0,
        "evaluations": [],  # list of QuestionEvaluation-shaped dicts
        "started_at": time.time(),
    }
    _SESSIONS[session_id] = session
    return session


def get_session(session_id: str) -> Optional[dict]:
    return _SESSIONS.get(session_id)


def get_question_by_id(question_id: str) -> Optional[dict]:
    return _QUESTIONS_BY_ID.get(question_id)


def get_all_sessions() -> list[dict]:
    """Return all sessions (for research data export). Read-only view."""
    return list(_SESSIONS.values())
