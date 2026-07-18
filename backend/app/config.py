import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    JUDGE0_API_KEY: str = os.getenv("JUDGE0_API_KEY", "")
    JUDGE0_HOST: str = os.getenv("JUDGE0_HOST", "judge0-ce.p.rapidapi.com")
    JUDGE0_URL: str = os.getenv("JUDGE0_URL", "https://judge0-ce.p.rapidapi.com")
    CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    CLAUDE_MODEL: str = os.getenv("CLAUDE_MODEL", "claude-sonnet-5")


settings = Settings()
