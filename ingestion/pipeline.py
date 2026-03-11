from pathlib import Path

from langchain_core.documents import Document

from ingestion.cleaner import clean_documents
from ingestion.chunker import chunk_documents
from ingestion.loader import load_pdf_documents



def run_ingestion_pipeline(
    pdf_path: Path, chunk_size: int = 800, chunk_overlap: int = 120
) -> list[Document]:
    docs = load_pdf_documents(pdf_path)
    cleaned = clean_documents(docs)
    chunks = chunk_documents(cleaned, chunk_size=chunk_size, chunk_overlap=chunk_overlap)

    # Keep source metadata for source attribution in answers.
    for idx, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = idx
        chunk.metadata["source_file"] = pdf_path.name

    return chunks
