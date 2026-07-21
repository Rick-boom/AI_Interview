"""
Runs candidate code against a question's test cases using a local Python
subprocess (for Python) or g++ (for C++).

No external API required — execution happens on the same machine as the
FastAPI server. This is the most reliable, free, zero-dependency approach.

Strategy: append a small "driver" snippet after the candidate's code.
The driver calls the candidate's function against every test case and prints
a single JSON blob wrapped in sentinel markers, which we parse back out of
stdout. ONE subprocess call evaluates ALL test cases for a question.
"""
import asyncio
import json
import os
import sys
import tempfile
from pathlib import Path

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


class CodeExecutionError(Exception):
    pass


def build_source(
    candidate_code: str,
    function_name: str,
    test_cases: list[dict],
    language: str,
    question: dict = None,
) -> str:
    if language == "cpp" and question and "cpp_driver" in question:
        return candidate_code + "\n\n" + question["cpp_driver"]

    driver = DRIVER_TEMPLATE.format(
        test_cases_json=json.dumps(test_cases),
        function_name_json=json.dumps(function_name),
        start_marker=START_MARKER,
        end_marker=END_MARKER,
    )
    return candidate_code + "\n\n" + driver


async def _run_subprocess(cmd: list[str], input_data: str = "", timeout: float = 10.0) -> tuple[str, str, int]:
    """Run a command asynchronously and return (stdout, stderr, returncode)."""
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout_b, stderr_b = await asyncio.wait_for(
            proc.communicate(input=input_data.encode()),
            timeout=timeout,
        )
    except asyncio.TimeoutError:
        proc.kill()
        await proc.communicate()
        return "", "Execution timed out (> 10s)", -1

    return (
        stdout_b.decode(errors="replace"),
        stderr_b.decode(errors="replace"),
        proc.returncode,
    )


async def run_against_test_cases(
    candidate_code: str,
    function_name: str,
    test_cases: list[dict],
    language: str = "python",
    question: dict = None,
) -> dict:
    """
    Executes candidate code locally via subprocess.

    Returns {"results": [...], "stderr": str|None, "compile_error": str|None, "status": str}
    """
    source = build_source(candidate_code, function_name, test_cases, language, question)

    # Write source to a temp file
    suffix = ".py" if language == "python" else ".cpp"
    with tempfile.NamedTemporaryFile(mode="w", suffix=suffix, delete=False, encoding="utf-8") as f:
        f.write(source)
        tmp_path = f.name

    try:
        if language == "python":
            # Run directly with the current Python interpreter
            python_exe = sys.executable
            stdout, stderr, returncode = await _run_subprocess([python_exe, tmp_path])
            compile_output = ""

        elif language == "cpp":
            # Compile with g++ then run
            exe_path = tmp_path.replace(".cpp", ".exe" if os.name == "nt" else "")
            _, compile_err, compile_rc = await _run_subprocess(
                ["g++", "-o", exe_path, tmp_path, "-std=c++17"]
            )
            if compile_rc != 0:
                return {
                    "results": [],
                    "stderr": None,
                    "compile_error": compile_err or "Compilation failed",
                    "status": "Compilation Error",
                }
            stdout, stderr, returncode = await _run_subprocess([exe_path])
            compile_output = ""
            # Clean up compiled exe
            try:
                os.unlink(exe_path)
            except OSError:
                pass
        else:
            return {
                "results": [],
                "stderr": None,
                "compile_error": f"Unsupported language: {language}",
                "status": "Error",
            }

    finally:
        # Clean up temp source file
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    # Determine status
    if returncode == -1:
        status = "Time Limit Exceeded"
    elif returncode != 0:
        status = f"Runtime Error (exit {returncode})"
    else:
        status = "Accepted"

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
        "compile_error": None,
        "status": status,
    }
