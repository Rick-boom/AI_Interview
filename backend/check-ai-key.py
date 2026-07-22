"""
Quick check: does your GEMINI_API_KEY actually work for AI grading?

Run it after setting a key in backend/.env:
    (from the backend folder, with the venv active)
    python check-ai-key.py
or just double-click  check-ai-key.bat

It makes ONE tiny request and tells you plainly whether the key works,
so you don't have to run the whole app to find out.
"""
from app.config import settings


def main() -> None:
    key = (settings.GEMINI_API_KEY or "").strip()
    print("=" * 60)
    print(" Gemini API key check")
    print("=" * 60)

    if not key:
        print("No GEMINI_API_KEY found in backend/.env. Add one and run again.")
        return

    print(f"Key prefix : {key[:6]}...   (length {len(key)})")
    print(f"Model      : {settings.GEMINI_MODEL}")

    if key.startswith("AQ."):
        print()
        print("Note: this is a new-format 'AQ.' key. Google's grading API")
        print("currently rejects these. Testing it anyway...")

    print("\nContacting Google...\n")
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=key)
        resp = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents="Reply with the single word: OK",
            config=types.GenerateContentConfig(max_output_tokens=5, temperature=0),
        )
        reply = (resp.text or "").strip()
        print("SUCCESS  -  the key works. Model replied:", repr(reply))
        print("AI grading will run. You're all set — start the app and go.")
    except Exception as e:
        detail = f"{e.__class__.__name__}: {e}"
        low = detail.lower()
        print("FAILED  -  the key did NOT work.")
        print("Reason:", detail[:300])
        if key.startswith("AQ.") or "access_token_type_unsupported" in low:
            print()
            print("This is the known 'AQ.' key problem. To get a working key:")
            print("  1. Go to https://console.cloud.google.com/ and create a NEW project.")
            print("  2. In 'APIs & Services > Library', enable 'Generative Language API'.")
            print("  3. In 'APIs & Services > Credentials', click 'Create credentials'")
            print("     > 'API key'. If it starts with 'AIza', paste it into backend/.env")
            print("     as GEMINI_API_KEY= and run this check again.")
            print("  If you still only get 'AQ.' keys, ask Claude to switch the grader")
            print("  to Claude or OpenAI instead.")
        elif "api key not valid" in low or "api_key_invalid" in low:
            print("\nThe key is not valid — check you copied the whole thing into .env.")
        else:
            print("\nThis looks like a network problem — check your internet connection.")


if __name__ == "__main__":
    main()
