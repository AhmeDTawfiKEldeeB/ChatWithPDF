from pathlib import Path

from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings



def build_faiss_store(documents: list[Document], embedding: Embeddings) -> FAISS:
    return FAISS.from_documents(documents, embedding)



def save_faiss_store(store: FAISS, directory: Path) -> None:
    directory.mkdir(parents=True, exist_ok=True)
    store.save_local(str(directory))



def load_faiss_store(directory: Path, embedding: Embeddings) -> FAISS:
    return FAISS.load_local(
        str(directory),
        embedding,
        allow_dangerous_deserialization=True,
    )
