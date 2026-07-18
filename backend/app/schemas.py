from typing import Any, Optional
from pydantic import BaseModel


class StartInterviewRequest(BaseModel):
    candidate_name: str = "Candidate"
    num_questions: int = 3
    difficulty: Optional[str] = None  # "Easy" | "Medium" | None (any)
    topic: Optional[str] = None


class PublicQuestion(BaseModel):
    id: str
    index: int
    total: int
    title: str
    difficulty: str
    topic: str
    company_tags: list[str]
    prompt: str
    constraints: list[str]
    starter_code: dict[str, str]


class StartInterviewResponse(BaseModel):
    session_id: str
    candidate_name: str
    total_questions: int
    questions: list[PublicQuestion]


class SubmitCodeRequest(BaseModel):
    question_id: str
    code: str
    language: str = "python"
    time_taken_seconds: Optional[int] = None


class TestCaseResult(BaseModel):
    test: int
    passed: bool
    output: Any = None
    expected: Any = None
    error: Optional[str] = None


class QuestionEvaluation(BaseModel):
    question_id: str
    title: str
    score: int
    correctness_score: int
    efficiency_score: int
    code_quality_score: int
    tests_passed: int
    tests_total: int
    detected_approach: str
    detected_time_complexity: str
    detected_space_complexity: str
    optimal_approach: str
    optimal_time_complexity: str
    optimal_space_complexity: str
    strengths: list[str]
    missed_points: list[str]
    feedback: str


class SubmitCodeResponse(BaseModel):
    evaluation: QuestionEvaluation


class ReportResponse(BaseModel):
    session_id: str
    candidate_name: str
    overall_score: int
    total_questions: int
    questions_answered: int
    duration_seconds: int
    evaluations: list[QuestionEvaluation]
    summary: str
