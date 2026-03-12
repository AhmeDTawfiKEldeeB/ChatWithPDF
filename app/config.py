import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    openrouter_api_key: str
    openrouter_base_url: str
    openrouter_model: str
    embedding_model_name: str
    chunk_size: int
    chunk_overlap: int
    top_k: int
    raw_pdfs_dir: Path
    vector_db_dir: Path
    langchain_tracing: bool
    langchain_api_key: str
    langchain_project: str



def get_settings() -> Settings:
    project_root = Path(__file__).resolve().parents[1]

    return Settings(
        openrouter_api_key=os.getenv("OPENROUTER_API_KEY", ""),
        openrouter_base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
        openrouter_model=os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-120b"),
        embedding_model_name=os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2"),
        chunk_size=int(os.getenv("CHUNK_SIZE", "800")),
        chunk_overlap=int(os.getenv("CHUNK_OVERLAP", "120")),
        top_k=int(os.getenv("TOP_K", "4")),
        raw_pdfs_dir=project_root / "data" / "raw_pdfs",
        vector_db_dir=project_root / "data" / "vector_db",
        langchain_tracing=os.getenv("LANGCHAIN_TRACING_V2", "false").lower() == "true",
        langchain_api_key=os.getenv("LANGCHAIN_API_KEY", ""),
        langchain_project=os.getenv("LANGCHAIN_PROJECT", "QA-RAG-System"),
    )
