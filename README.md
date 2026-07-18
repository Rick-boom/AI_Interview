# AI_Interview

An all-in-one AI-powered interview prep platform for students.

## Project Structure

This project has been consolidated into a clean Monorepo containing:
- **`frontend/`**: The Vanilla JS & Vite-powered stunning user interface.
- **`backend/`**: The Python FastAPI server for serving dynamic questions, executing code via Judge0, and grading via Anthropic AI.

## Quick Start

### 1. Start the Backend
1. Navigate to the `backend/` directory: `cd backend`
2. Create a virtual environment: `python -m venv .venv`
3. Activate it: `.\.venv\Scripts\Activate.ps1` (Windows) or `source .venv/bin/activate` (Mac/Linux)
4. Install dependencies: `pip install -r requirements.txt`
5. Create a `.env` file based on `.env.example` with your Judge0 and Anthropic API keys.
6. Start the server: `uvicorn app.main:app --reload --port 8000`

### 2. Start the Frontend
1. Navigate to the `frontend/` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

Navigate to `http://localhost:5173` to access the platform.

## Features
- **Dynamic Session Flow**: Pulls randomized algorithmic questions spanning Easy, Medium, and Hard difficulties.
- **Real-Time Code Execution**: Powered by Judge0, code is safely executed against robust test cases.
- **AI Analysis**: Anthropic analyzes your code for Correctness, Time Complexity, and Space Complexity.
- **Visual Reports**: Provides a comprehensive breakdown of your mock interview performance, complete with constructive feedback.
