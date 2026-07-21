# Multimodal Automated Technical Assessment

**Evaluating Code-to-Explanation Alignment and Cognitive Load Using Large Language Models**

An advanced, research-grade AI-powered technical interview platform. This project goes beyond standard code execution by evaluating a candidate’s code alongside their transcribed **verbal explanation**, while simultaneously tracking **cognitive load telemetry** and enforcing **intelligent proctoring**.

---

## 🔬 The Research Hypothesis

> *Evaluating a candidate’s code alongside their transcribed verbal explanation—while tracking cognitive load telemetry—significantly increases grading reliability, detects algorithmic bluffing, and reduces automated evaluator bias compared to standard code-only evaluation.*

## ✨ Core Features

### 1. Multimodal AI Grader (Explainable AI)
Powered by Anthropic's Claude, the grading engine doesn't just look at the code. It cross-references the candidate's **verbal explanation** against their actual implementation to calculate:
- **Alignment Score:** Does the candidate's code match what they said they were going to do?
- **Bluffing Detection:** Flags candidates who verbally claim an $O(N)$ optimal approach but silently write an $O(N^2)$ brute-force solution.
- **Verbal Clarity:** Assesses the candidate's ability to communicate technical concepts clearly.
- **Confidence Percentage & Bias Audit:** Ensures the AI's grading is fair and statistically confident.

### 2. Cognitive Load Telemetry
Tracks behavioral metadata in the background to assess candidate struggle and proficiency:
- Paste frequency
- Compilation retry rates
- Time-to-first-compile

### 3. Native Voice Engine
Integrated Web Speech API captures real-time verbal explanations through a sleek, non-intrusive microphone button in the editor. No third-party API keys required for transcription.

### 4. Intelligent Proctoring Engine
A smart, debounced proctoring system that monitors interview integrity without being overly sensitive:
- **Face Detection:** Uses native `FaceDetector` API (or a fallback Canvas heuristic algorithm) to ensure the candidate is present and alone.
- **Screen & Tab Monitoring:** Tracks window blurs and tab switches with grace periods.
- **Clipboard Monitoring:** Differentiates between legitimate code editing inside the Monaco Editor vs. suspicious external pasting.
- **Severity Scoring:** Escalates repeated incidents automatically (Low → Medium → High → Critical) and calculates an overall Risk Score.

### 5. Professional Test Environment UI
- **Premium Aesthetic:** Dark "Obsidian Gold" glassmorphic UI.
- **Distraction-Free Editor:** Fully resizable, full-screen Monaco Editor that perfectly scales to hide the browser UI.
- **Draggable Proctoring:** A floating, draggable Picture-in-Picture (PiP) camera widget.
- **CSV Data Export:** One-click export of all session telemetry, XAI scores, and transcripts for external research analysis.

---

## 📂 Project Structure

This project is structured as a clean Monorepo:
- **`frontend/`**: Vanilla JavaScript, Vite, Monaco Editor, and native Web APIs.
- **`backend/`**: Python FastAPI server, Judge0 (for secure code execution), and Anthropic Claude (for multimodal AI grading).

---

## 🚀 Quick Start

### 1. Start the Backend
1. Navigate to the `backend/` directory: `cd backend`
2. Create a virtual environment: `python -m venv .venv`
3. Activate it: 
   - Windows: `.\.venv\Scripts\Activate.ps1` 
   - Mac/Linux: `source .venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Create a `.env` file based on `.env.example` with your **Judge0** and **Anthropic** API keys.
6. Start the server: `uvicorn app.main:app --reload --port 8000`

### 2. Start the Frontend
1. Navigate to the `frontend/` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

Navigate to `http://localhost:5173` to access the platform and start your mock interview!
