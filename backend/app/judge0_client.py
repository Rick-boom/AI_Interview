"""
Runs candidate code against a question's test cases using Judge0.

Strategy: append a small Python "driver" snippet after the candidate's code.
The driver calls the candidate's function against every test case and prints
a single JSON blob wrapped in sentinel markers, which we parse back out of
stdout. This means ONE Judge0 submission evaluates ALL test cases for a
question (fast, one round trip) rather than one submission per test case.
"""
import base64
import json
import httpx

from app.config import settings

# Judge0 language id for Python 3 (71) and C++ GCC (54)
LANGUAGE_IDS = {
    "python": 71,
    "cpp": 54,
}

START_MARKER = "###RESULTS_START###"
END_MARKER = "###RESULTS_END###"

DRIVER_TEMPLATE = """
import json, time

__TEST_CASES__ = {test_cases_json}
__FUNCTION_NAME__ = {function_name_json}

__results__ = []
__fn__ = globals().get(__FUNCTION_NAME__)

if __fn__ is None:
    __results__.append({{"test": 0, "passed": False, "error": "Function '" + __FUNCTION_NAME__ + "' was not found. Did you rename it?"}})
else:
    for __i__, __tc__ in enumerate(__TEST_CASES__):
        try:
            __start__ = time.time()
            __out__ = __fn__(*__tc__["input"])
            __elapsed__ = time.time() - __start__
            __results__.append({{
                "test": __i__,
                "passed": __out__ == __tc__["expected"],
                "output": __out__,
                "expected": __tc__["expected"],
                "elapsed_ms": round(__elapsed__ * 1000, 3),
            }})
        except Exception as __e__:
            __results__.append({{"test": __i__, "passed": False, "error": str(__e__), "expected": __tc__["expected"]}})

print("{start_marker}")
print(json.dumps(__results__))
print("{end_marker}")
"""


class Judge0Error(Exception):
    pass


def build_source(candidate_code: str, function_name: str, test_cases: list[dict], language: str, question: dict = None) -> str:
    if language == "cpp" and question and "cpp_driver" in question:
        return candidate_code + "\n\n" + question["cpp_driver"]
    
    driver = DRIVER_TEMPLATE.format(
        test_cases_json=json.dumps(test_cases),
        function_name_json=json.dumps(function_name),
        start_marker=START_MARKER,
        end_marker=END_MARKER,
    )
    return candidate_code + "\n\n" + driver


async def run_against_test_cases(candidate_code: str, function_name: str, test_cases: list[dict], language: str = "python", question: dict = None) -> dict:
    """
    Returns {"results": [...], "stderr": str|None, "compile_error": str|None, "status": str}
    Falls back to a clear error dict if Judge0 isn't configured, rather than raising,
    so the rest of the pipeline (LLM feedback) can still run.
    """
    if not settings.JUDGE0_API_KEY:
        return {
            "results": [],
            "stderr": None,
            "compile_error": None,
            "status": "judge0_not_configured",
        }

    language_id = LANGUAGE_IDS.get(language, 71)
    source = build_source(candidate_code, function_name, test_cases, language, question)

    headers = {
        "content-type": "application/json",
        "X-RapidAPI-Key": settings.JUDGE0_API_KEY,
        "X-RapidAPI-Host": settings.JUDGE0_HOST,
    }
    payload = {
        "source_code": base64.b64encode(source.encode()).decode(),
        "language_id": language_id,
        "stdin": "",
        "cpu_time_limit": 5,
    }

    url = f"{settings.JUDGE0_URL}/submissions?base64_encoded=true&wait=true"

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, headers=headers, json=payload)
        if resp.status_code >= 400:
            raise Judge0Error(f"Judge0 returned {resp.status_code}: {resp.text}")
        data = resp.json()

    def _decode(field: str) -> str:
        val = data.get(field)
        if not val:
            return ""
        try:
            return base64.b64decode(val).decode(errors="replace")
        except Exception:
            return val

    stdout = _decode("stdout")
    stderr = _decode("stderr")
    compile_output = _decode("compile_output")
    status_desc = (data.get("status") or {}).get("description", "Unknown")

    results = []
    if START_MARKER in stdout and END_MARKER in stdout:
        blob = stdout.split(START_MARKER, 1)[1].split(END_MARKER, 1)[0].strip()
        try:
            results = json.loads(blob)
        except json.JSONDecodeError:
            results = []

    return {
        "results": results,
        "stderr": stderr or None,
        "compile_error": compile_output or None,
        "status": status_desc,
    }
