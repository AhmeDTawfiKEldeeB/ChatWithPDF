# QA-RAG-System

Modular Retrieval-Augmented Generation (RAG) system with a real web stack:

- Frontend: Next.js (React)
- Backend: FastAPI
- RAG pipeline: ingestion -> embeddings -> FAISS vectorstore -> retrieval/rerank -> answer generation

## Project Structure

```text
QA-RAG-SYSTEM/
├── app/
│   ├── main.py  # FastAPI backend API
│   └── config.py
├── frontend/
│   └── ...      # Next.js web frontend
├── ingestion/
│   ├── loader.py
│   ├── cleaner.py
│   ├── chunker.py
│   └── pipeline.py
├── embeddings/
│   └── embedding_model.py
├── vectorstore/
│   ├── faiss_store.py
│   └── manager.py
├── retrieval/
│   ├── retriever.py
│   └── reranker.py
├── rag/
│   ├── prompt.py
│   └── rag_chain.py
├── utils/
│   └── helpers.py
└── data/
	├── raw_pdfs/
	└── vector_db/
```

## Environment Variables

Create a `.env` file in the project root (you can copy from `.env.example`):

```env
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openai/gpt-oss-120b

EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
CHUNK_SIZE=800
CHUNK_OVERLAP=120
TOP_K=4
```

## Install

```bash
python -m pip install -r requirements.txt
```

## Run Backend API

```bash
uvicorn app.main:app --reload --port 8000
```

or simply:

```bash
python main.py
```

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:3000`
Backend default URL: `http://localhost:8000`

Set frontend backend base URL by creating `frontend/.env.local` (you can copy from `frontend/.env.local.example`):

```bash
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
```

Open the frontend URL, upload/process a PDF, then ask questions.

## Product Pages

- Landing page: `http://localhost:3000/`
- Dashboard: `http://localhost:3000/dashboard`

## Core API Endpoints

- `POST /upload`
	- Multipart form with `file` (PDF)
	- Runs ingestion pipeline: load -> extract -> clean -> chunk -> embed -> store (FAISS)
- `POST /ask`
	- JSON body: `{ "document_id": "...", "question": "..." }`
	- Retrieves relevant chunks and generates a grounded answer with the LLM
- `GET /documents`
	- Returns uploaded documents with status

Backward-compatible `/api/*` endpoints remain available.

## Troubleshooting: "Failed to fetch"

1. Start FastAPI on port `8000`:
	`uvicorn app.main:app --reload --port 8000`
2. Verify health endpoint in browser: `http://localhost:8000/api/health`
3. Frontend upload/ask calls use:
	- `POST ${NEXT_PUBLIC_API_BASE}/upload`
	- `POST ${NEXT_PUBLIC_API_BASE}/ask`
4. CORS is configured with `allow_origins=["*"]` in `app/main.py`.

## Notes

- Uploaded files are saved under `data/raw_pdfs/`.
- FAISS indexes are stored in `data/vector_db/` and reused if the same PDF is processed again.
- Process response now uses the message style `Process done for: <pdf_name>`.
- Answers are grounded in retrieved PDF chunks with a simple lexical reranking step.