import os

from dotenv import load_dotenv

# Load .env BEFORE anything else — ensures LangSmith vars are set
# before uvicorn spawns reload workers
load_dotenv()

if os.getenv("LANGCHAIN_TRACING_V2", "false").lower() == "true":
    os.environ.setdefault("LANGSMITH_TRACING", "true")
    os.environ.setdefault("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")
    if os.getenv("LANGCHAIN_API_KEY"):
        os.environ.setdefault("LANGSMITH_API_KEY", os.environ["LANGCHAIN_API_KEY"])
    if os.getenv("LANGCHAIN_PROJECT"):
        os.environ.setdefault("LANGSMITH_PROJECT", os.environ["LANGCHAIN_PROJECT"])

if os.getenv("LANGSMITH_TRACING", "false").lower() == "true":
    os.environ.setdefault("LANGCHAIN_TRACING_V2", "true")
    os.environ.setdefault("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")
    if os.getenv("LANGSMITH_API_KEY"):
        os.environ.setdefault("LANGCHAIN_API_KEY", os.environ["LANGSMITH_API_KEY"])
    if os.getenv("LANGSMITH_PROJECT"):
        os.environ.setdefault("LANGCHAIN_PROJECT", os.environ["LANGSMITH_PROJECT"])

import uvicorn


def main() -> None:
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    reload_enabled = os.getenv("RELOAD", "true").lower() == "true"

    uvicorn.run("app.main:app", host=host, port=port, reload=reload_enabled)


if __name__ == "__main__":
    main()
