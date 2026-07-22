from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import interview

app = FastAPI(
    title="Mock Interview API",
    description="Backend for the AI mock-interview module: serves DSA questions, "
    "executes candidate code, and scores submissions.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    # Allow the Vite dev server on ANY localhost / 127.0.0.1 port. Vite falls back to
    # 5174, 5175, ... when 5173 is taken, and a mismatched origin here shows up in the
    # browser as a confusing "Failed to fetch". The regex keeps local dev working
    # regardless of which port Vite lands on.
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
