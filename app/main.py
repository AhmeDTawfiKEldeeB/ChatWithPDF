from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from threading import RLock
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI

from app.config import get_settings
from rag.rag_chain import answer_with_rerank
from retrieval.retriever import build_retriever
from utils.helpers import save_uploaded_pdf
from vectorstore.manager import build_or_load_store_for_pdf, _index_dir_for_pdf


settings = get_settings()
app = FastAPI(title="QA RAG API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@dataclass
class LoadedContext:
    retriever: object


class AskRequest(BaseModel):
    document_id: str = Field(min_length=1)
    question: str = Field(min_length=1)


class ProcessExistingRequest(BaseModel):
    document_name: str | None = None
    document_id: str | None = None


class ApiState:
    def __init__(self) -> None:
        self._lock = RLock()
        self._contexts: dict[str, LoadedContext] = {}

    def set_context(self, document_id: str, context: LoadedContext) -> None:
        with self._lock:
            self._contexts[document_id] = context

    def get_context(self, document_id: str) -> LoadedContext | None:
        with self._lock:
            return self._contexts.get(document_id)


state = ApiState()


def _build_llm() -> ChatOpenAI:
    return ChatOpenAI(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        model=settings.openrouter_model,
        temperature=0,
    )


def _raw_pdf_paths() -> list[Path]:
    if not settings.raw_pdfs_dir.exists():
        return []
    return sorted(settings.raw_pdfs_dir.glob("*.pdf"), key=lambda p: p.stat().st_mtime, reverse=True)


def _document_id_from_path(pdf_path: Path) -> str:
    # Use the persisted filename stem as the stable public id.
    return pdf_path.stem


def _path_for_document_name(document_name: str) -> Path:
    for pdf_path in _raw_pdf_paths():
        if pdf_path.name == document_name:
            return pdf_path
    raise HTTPException(status_code=404, detail=f"Document not found: {document_name}")


def _path_for_document_id(document_id: str) -> Path:
    for pdf_path in _raw_pdf_paths():
        if _document_id_from_path(pdf_path) == document_id:
            return pdf_path
    raise HTTPException(status_code=404, detail=f"Document not found for id: {document_id}")


def _process_pdf(pdf_path: Path) -> dict[str, Any]:
    store, chunk_count = build_or_load_store_for_pdf(
        pdf_path=pdf_path,
        vector_db_root=settings.vector_db_dir,
        embedding_model_name=settings.embedding_model_name,
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )

    context = LoadedContext(
        retriever=build_retriever(store, k=settings.top_k),
    )
    document_id = _document_id_from_path(pdf_path)
    state.set_context(document_id, context)

    detail = "Existing index detected and reused." if chunk_count == -1 else f"New index created from {chunk_count} chunks."
    return {
        "document_id": document_id,
        "document_name": pdf_path.name,
        "status": "indexed",
        "detail": detail,
        "pipeline": {
            "step_1": "load pdf",
            "step_2": "extract text",
            "step_3": "clean text",
            "step_4": "chunk text",
            "step_5": "create embeddings",
            "step_6": "store vectors",
        },
        "indexed_chunks": 0 if chunk_count == -1 else chunk_count,
    }


@app.get("/api/health")
def health() -> dict:
    return {"ok": True}


@app.get("/api/documents")
def list_documents() -> dict:
    docs = []
    for p in _raw_pdf_paths():
        document_id = _document_id_from_path(p)
        docs.append(
            {
                "document_id": document_id,
                "name": p.name,
                "size_bytes": p.stat().st_size,
                "status": "ready" if state.get_context(document_id) else "uploaded",
            }
        )
    return {"documents": docs}


@app.get("/documents")
def list_documents_public() -> dict:
    return list_documents()


@app.post("/api/upload-process")
async def upload_and_process(file: UploadFile = File(...)) -> dict:
    if file.content_type not in {"application/pdf", "application/x-pdf"}:
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    saved_pdf = save_uploaded_pdf(
        file_bytes=file_bytes,
        target_dir=settings.raw_pdfs_dir,
        original_name=file.filename or "document.pdf",
    )
    return _process_pdf(saved_pdf)


@app.post("/upload")
async def upload(file: UploadFile = File(...)) -> dict:
    return await upload_and_process(file)


@app.post("/api/process-existing")
def process_existing(request: ProcessExistingRequest) -> dict:
    if request.document_id:
        pdf_path = _path_for_document_id(request.document_id)
    elif request.document_name:
        pdf_path = _path_for_document_name(request.document_name)
    else:
        raise HTTPException(status_code=400, detail="Either document_id or document_name is required")
    return _process_pdf(pdf_path)


@app.post("/api/chat")
def chat(request: AskRequest) -> dict:
    context = state.get_context(request.document_id)
    if not context:
        raise HTTPException(
            status_code=400,
            detail="Document is not processed in this server session. Process the PDF first.",
        )

    if not settings.openrouter_api_key:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY is not configured")

    llm = _build_llm()

    answer, docs = answer_with_rerank(
        request.question,
        retriever=context.retriever,
        llm=llm,
        top_n=settings.top_k,
    )

    retrieved_context = [
        {
            "source_file": doc.metadata.get("source_file", "unknown"),
            "page": doc.metadata.get("page", "?"),
            "content": doc.page_content,
        }
        for doc in docs
    ]

    return {
        "answer": answer,
        "context": retrieved_context,
    }


@app.post("/ask")
def ask(request: AskRequest) -> dict:
    return chat(request)


class DeleteDocumentRequest(BaseModel):
    document_id: str = Field(min_length=1)


@app.delete("/api/documents/{document_id}")
def delete_document(document_id: str) -> dict:
    pdf_path = _path_for_document_id(document_id)

    # Remove FAISS index directory
    index_dir = _index_dir_for_pdf(pdf_path, settings.vector_db_dir)
    if index_dir.exists():
        import shutil
        shutil.rmtree(index_dir, ignore_errors=True)

    # Remove in-memory context
    with state._lock:
        state._contexts.pop(document_id, None)

    # Remove the PDF file
    pdf_path.unlink(missing_ok=True)

    return {"ok": True, "document_id": document_id}


@app.delete("/documents/{document_id}")
def delete_document_public(document_id: str) -> dict:
    return delete_document(document_id)
