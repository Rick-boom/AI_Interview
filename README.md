# Multimodal Automated Technical Assessment

**Evaluating Code-to-Explanation Alignment and Cognitive Load Using Large Language Models**

An advanced, research-grade AI-powered technical interview platform. This project goes beyond standard code execution by evaluating a candidate’s code alongside their transcribed **verbal explanation**, while simultaneously tracking **cognitive load telemetry** and enforcing **intelligent proctoring**.

---

## 🔬 The Research Hypothesis

> *Evaluating a candidate’s code alongside their transcribed verbal explanation—while tracking cognitive load telemetry—significantly increases grading reliability, detects algorithmic bluffing, and reduces automated evaluator bias compared to standard code-only evaluation.*

## ✨ Core Features

### 1. Multimodal AI Grader (Explainable AI)
Powered by LLM evaluation (Google Gemini / Anthropic Claude with deterministic rule-based fallback), the grading engine cross-references the candidate's **verbal explanation** against their actual implementation to calculate:
- **Alignment Score:** Does the candidate's code match what they said they were going to do?
- **Bluffing Detection:** Flags candidates who verbally claim an $O(N)$ optimal approach but silently write an $O(N^2)$ brute-force solution.
- **Verbal Clarity:** Assesses the candidate's ability to communicate technical concepts clearly.
- **Confidence Percentage & Bias Audit:** Ensures the AI's grading is fair, transparent, and statistically confident.

### 2. Cognitive Load Telemetry
Tracks behavioral metadata in the background to assess candidate struggle and proficiency:
- Paste frequency & external clipboard detection
- Compilation retry rates
- Time-to-first-compile

### 3. Native Voice Engine
Integrated Web Speech API captures real-time verbal explanations through a sleek, non-intrusive microphone button in the editor. No third-party transcription API keys required.

### 4. Intelligent Proctoring Engine
A smart, debounced proctoring system that monitors interview integrity:
- **Face Detection:** Uses native `FaceDetector` API (or a fallback Canvas heuristic algorithm) to ensure the candidate is present and alone.
- **Screen & Tab Monitoring:** Tracks window blurs and tab switches with grace periods.
- **Clipboard Monitoring:** Differentiates between legitimate code editing inside the Monaco Editor vs. suspicious external pasting.
- **Severity Scoring:** Escalates repeated incidents automatically (Low → Medium → High → Critical) and calculates an overall Risk Score.

### 5. Professional Test Environment UI & Execution Engine
- **Obsidian Gold Aesthetic:** Dark glassmorphic, responsive interface.
- **Code Runner Engine:** Multi-language execution support (Python 3 & C++) via local runner/Piston API.
- **Distraction-Free Editor:** Fully resizable Monaco Editor with live syntax highlighting and code completion.
- **Draggable Proctoring:** Floating Picture-in-Picture (PiP) webcam monitor.
- **CSV & Report Data Export:** One-click export of session telemetry, XAI evaluation scores, test results, and verbal transcripts for research analysis.

---

## 📂 Project Structure

This project is structured as a clean Monorepo:
- **`frontend/`**: Vanilla JavaScript, Vite, Monaco Editor, and native Web APIs.
- **`backend/`**: Python FastAPI server, multi-language execution engine, and LLM Multimodal Grader.
- **`START-HERE.bat`**: One-click startup script for Windows.
- **`HOW-TO-RUN.md`**: Complete setup guide, AI key configuration, and troubleshooting documentation.

---

## 🚀 Quick Start

### ⚡ Option A: One-Click Start (Windows - Recommended)
Simply double-click **`START-HERE.bat`** in the root directory!
1. It automatically sets up the Python virtual environment (`.venv`), installs backend dependencies, and initializes Node.js dependencies (`npm install`).
2. It launches both the **FastAPI Backend** (`http://localhost:8000`) and **Vite Frontend** (`http://localhost:5173`).
3. Open **http://localhost:5173** in Google Chrome or Microsoft Edge to begin.

### 🛠️ Option B: Manual Setup

#### 1. Start the Backend
```bash
cd backend
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 2. Start the Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173` to access the platform.

For detailed setup, Gemini/Claude API key options, and troubleshooting, see [HOW-TO-RUN.md](file:///c:/Users/TITAN/Desktop/RESEARCH/AI_Interview/HOW-TO-RUN.md).

