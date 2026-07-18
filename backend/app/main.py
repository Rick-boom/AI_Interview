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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
