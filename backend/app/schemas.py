"""
Pydantic schemas for the Multimodal AI Interview Assessment Platform.

Research Project: Multimodal Automated Technical Assessment
Hypothesis: Code + Verbal Explanation + Telemetry increases grading reliability,
            detects algorithmic bluffing, and reduces evaluator bias vs code-only.
"""
from typing import Any, Optional
from pydantic import BaseModel, Field


# ─── Telemetry Schema ─────────────────────────────────────────────────────────

class TelemetryData(BaseModel):
    """Cognitive load signals collected during the coding session."""
    time_to_first_compile: Optional[int] = Field(
        default=None,
        description="Seconds from question load to first Run attempt — measures problem comprehension speed."
    )
    compilation_retries: int = Field(
        default=0,
        description="Number of Run attempts — high count signals debugging struggle or iteration style."
    )
    paste_count: int = Field(
        default=0,
        description="Number of paste events in the editor (outside Monaco) — potential look-up signal."
    )
    # Aliases accepted from frontend (camelCase)
    timeToFirstCompile:  Optional[int] = Field(default=None, exclude=True)
    compilationRetries:  Optional[int] = Field(default=None, exclude=True)
    pasteCount:          Optional[int] = Field(default=None, exclude=True)

    def model_post_init(self, __context: Any) -> None:
        """Accept both snake_case and camelCase from frontend."""
        if self.timeToFirstCompile  is not None and self.time_to_first_compile  is None:
            self.time_to_first_compile  = self.timeToFirstCompile
        if self.compilationRetries   is not None and self.compilation_retries   == 0:
            self.compilation_retries   = self.compilationRetries
        if self.pasteCount           is not None and self.paste_count           == 0:
            self.paste_count           = self.pasteCount


# ─── Session Start ─────────────────────────────────────────────────────────────

class StartInterviewRequest(BaseModel):
    candidate_name: str = "Candidate"
    num_questions:  int = 3
    difficulty:     Optional[str] = None   # "Easy" | "Medium" | "Hard" | None (any)
    topic:          Optional[str] = None


class PublicQuestion(BaseModel):
    id:           str
    index:        int
    total:        int
    title:        str
    difficulty:   str
    topic:        str
    company_tags: list[str]
    prompt:       str
    constraints:  list[str]
    starter_code: dict[str, str]


class StartInterviewResponse(BaseModel):
    session_id:      str
    candidate_name:  str
    total_questions: int
    questions:       list[PublicQuestion]


# ─── Submission (Multimodal) ───────────────────────────────────────────────────

class SubmitCodeRequest(BaseModel):
    """
    Multimodal submission: code + verbal explanation + cognitive load telemetry.
    All three together enable the Alignment Score research metric.
    """
    question_id:         str
    code:                str
    language:            str = "python"
    time_taken_seconds:  Optional[int] = None

    # Research additions
    verbal_explanation:  str = Field(
        default="No verbal explanation provided.",
        description="Live speech transcription of the candidate's explanation of their approach."
    )
    telemetry:           TelemetryData = Field(
        default_factory=TelemetryData,
        description="Cognitive load metrics collected during the session."
    )


# ─── Evaluation (Code-only, backward compat) ──────────────────────────────────

class TestCaseResult(BaseModel):
    test:       int
    passed:     bool
    input:      Any = None
    output:     Any = None
    expected:   Any = None
    error:      Optional[str] = None
    elapsed_ms: Optional[float] = None


class QuestionEvaluation(BaseModel):
    """Standard code-only evaluation fields (backward compat with existing report schema)."""
    question_id:                str
    title:                      str
    score:                      int
    correctness_score:          int
    efficiency_score:           int
    code_quality_score:         int
    tests_passed:               int
    tests_total:                int
    detected_approach:          str
    detected_time_complexity:   str
    detected_space_complexity:  str
    optimal_approach:           str
    optimal_time_complexity:    str
    optimal_space_complexity:   str
    strengths:                  list[str]
    missed_points:              list[str]
    feedback:                   str

    # ── XAI / Research metrics (optional — present when verbal_explanation supplied) ──
    verbal_clarity_score:       Optional[int]  = Field(
        default=None,
        description="0–100: how clearly the candidate articulated their algorithm."
    )
    alignment_score:            Optional[int]  = Field(
        default=None,
        description="0–100: does verbal explanation match actual code logic? Low = algorithmic bluffing detected."
    )
    bluffing_detected:          Optional[bool] = Field(
        default=None,
        description="True if candidate claimed better complexity than code actually achieves."
    )
    confidence_percentage:      Optional[int]  = Field(
        default=None,
        description="AI self-reported confidence in this evaluation (0–100)."
    )
    bias_audit_passed:          Optional[bool] = Field(
        default=None,
        description="True if score is based on logic/correctness, ignoring style/accent/grammar."
    )
    verbal_explanation_summary: Optional[str]  = None


class SubmitCodeResponse(BaseModel):
    evaluation: QuestionEvaluation
    # ── Execution details, so the frontend can show a LeetCode-style breakdown ──
    status:        str = "Unknown"                 # Accepted | Wrong Answer | Compilation Error | ...
    tests_passed:  int = 0
    tests_total:   int = 0
    test_results:  list[TestCaseResult] = []
    compile_error: Optional[str] = None
    stderr:        Optional[str] = None


# ─── Report ───────────────────────────────────────────────────────────────────

class ReportResponse(BaseModel):
    session_id:          str
    candidate_name:      str
    overall_score:       int
    total_questions:     int
    questions_answered:  int
    duration_seconds:    int
    evaluations:         list[QuestionEvaluation]
    summary:             str


# ─── Research Data Export ─────────────────────────────────────────────────────

class ResearchRecord(BaseModel):
    """A single row in the research CSV export."""
    submission_id:              str
    session_id:                 str
    candidate_name:             str
    question_id:                str
    question_title:             str
    difficulty:                 str
    language:                   str
    overall_score:              int
    correctness_score:          int
    efficiency_score:           int
    code_quality_score:         int
    verbal_clarity_score:       Optional[int]
    alignment_score:            Optional[int]
    bluffing_detected:          Optional[bool]
    confidence_percentage:      Optional[int]
    bias_audit_passed:          Optional[bool]
    tests_passed:               int
    tests_total:                int
    time_to_first_compile_s:    Optional[int]
    compilation_retries:        int
    paste_count:                int
    time_taken_seconds:         Optional[int]
    has_verbal_explanation:     bool
    timestamp:                  str
