from pathlib import Path

from langchain_community.vectorstores import FAISS

from embeddings.embedding_model import get_embedding_model
from ingestion.pipeline import run_ingestion_pipeline
from utils.helpers import ensure_dir, file_sha1
from vectorstore.faiss_store import build_faiss_store, load_faiss_store, save_faiss_store



def _index_dir_for_pdf(pdf_path: Path, vector_db_root: Path) -> Path:
    doc_hash = file_sha1(pdf_path)[:12]
    return vector_db_root / f"{pdf_path.stem}_{doc_hash}"



def build_or_load_store_for_pdf(
    pdf_path: Path,
    vector_db_root: Path,
    embedding_model_name: str,
    chunk_size: int,
    chunk_overlap: int,
) -> tuple[FAISS, int]:
    ensure_dir(vector_db_root)
    index_dir = _index_dir_for_pdf(pdf_path, vector_db_root)
    embedding = get_embedding_model(embedding_model_name)

    if (index_dir / "index.faiss").exists() and (index_dir / "index.pkl").exists():
        return load_faiss_store(index_dir, embedding), -1

    chunks = run_ingestion_pipeline(
        pdf_path=pdf_path,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    store = build_faiss_store(chunks, embedding)
    save_faiss_store(store, index_dir)
    return store, len(chunks)
