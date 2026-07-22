# How to run the AI Interview platform (and what was fixed)

## TL;DR — start it in one click

1. Double-click **`START-HERE.bat`** (in this folder).
2. Two black windows open — one **Backend**, one **Frontend**. Leave both open.
3. Wait until:
   - the Backend window says `Application startup complete`, and
   - the Frontend window says `Local:   http://localhost:5173/`
4. Open **http://localhost:5173** in **Chrome or Edge**.

That's it. To stop everything, close the two windows.

> First run only: the scripts create the Python virtual environment, install the
> Python packages, and run `npm install`. This can take a couple of minutes.
> Every run after that is fast.

---

## Why you saw "Failed: Failed to fetch"

That error comes from the **browser being unable to reach the backend**. Your
frontend (the page at `localhost:5173`) sends the code to the backend API at
`localhost:8000`. If nothing is answering on port 8000, the browser reports
`Failed to fetch`.

The backend code itself was fine — I ran the whole flow end to end (start a
session → submit code → the code actually executes and is graded → report → CSV
export) and every part works, in both Python and C++. The problem was purely
that **the backend server wasn't running / reachable** when you clicked
*Run & Submit*. Two things caused or hid that:

1. **The backend has to be started separately** and kept running. The one-click
   `START-HERE.bat` now does that for you.
2. **A CORS port mismatch.** If Vite ever starts the frontend on a different
   port (e.g. `5174` because `5173` was busy), the old backend only trusted
   `5173` and silently blocked the request — which also shows up as
   `Failed to fetch`. The backend now trusts **any** `localhost` port.

---

## Manual steps (if you prefer, or if a script fails)

**Backend** (first terminal):

```bat
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend** (second terminal — leave the backend one running):

```bat
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173.

You need **Python 3.10+** and **Node.js 18+** installed and on your PATH.
(Check with `python --version` and `node --version`.)
C++ grading additionally needs **g++** (e.g. MinGW-w64) on your PATH; Python
grading needs nothing extra.

---

## AI grading / API key — please read

The scores, the report, and the pass/fail test results **all work without any AI
key** (they run your code against real test cases). The *AI* layer adds the
extra research features: interviewer-style written feedback, detected time/space
complexity, and — when you record a verbal explanation — the alignment score,
bluffing detection, verbal-clarity and bias-audit metrics.

**Your current key won't drive those AI features.** The key in `backend/.env`
begins with **`AQ.`**. Google recently started issuing these new-format "auth"
keys, and their `generateContent` API currently **rejects** them with
`ACCESS_TOKEN_TYPE_UNSUPPORTED`. This is a known, still-open Google issue — it is
not a bug in this project. When the AI call is rejected, the app falls back to a
score based purely on the test-case pass rate and shows a note explaining why.

You have three options:

1. **Get a standard `AIza…` Gemini key (best if you can).**
   Try https://aistudio.google.com/apikey — if it still hands you an `AQ.` key,
   create a brand-new project in the **Google Cloud Console**, enable the
   **Generative Language API**, then create an API key under
   *APIs & Services → Credentials*. Some accounts get an `AIza` key this way.
   Paste it into `backend/.env` as `GEMINI_API_KEY=` and restart the backend.

2. **Use a different provider.** Your environment already has the `anthropic`
   package installed, so the grader can be switched to Claude (or OpenAI) if you
   have one of those API keys. Ask and I'll wire it up.

3. **Do nothing.** Everything except the AI-written feedback keeps working —
   correctness, efficiency estimate, test results, the report, and the CSV
   export are all still produced.

Whichever you pick, the app runs fine today.

---

## Quick troubleshooting

| Symptom | Fix |
|---|---|
| `Failed to fetch` when you Run/Submit | The **backend** window isn't running. Re-run `START-HERE.bat` and wait for `Application startup complete`. |
| Backend window closes instantly | Python isn't installed / not on PATH. Install Python 3.10+ and tick "Add to PATH". |
| Frontend window closes instantly | Node.js isn't installed. Install the LTS from https://nodejs.org/. |
| `Port 8000 is already in use` | An old backend is still running. Close other backend windows, or reboot, then retry. |
| Feedback says "AI grading is off … AQ. key" | Expected — see **AI grading / API key** above. Scores still work. |
| C++ says "Compilation failed" | Install g++/MinGW-w64 and reopen the terminal, or just use Python. |

---

*Security note:* your real API key is stored in `backend/.env`. Keep that file
private and don't commit it to a public GitHub repo.
