from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document

def load_pdf_documents(pdf_path: Path) -> list[Document]:
    loader = PyPDFLoader(str(pdf_path))
    return loader.load()
