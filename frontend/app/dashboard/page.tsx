"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import ParticleBackground from "../../components/ParticleBackground";
import TypingDots from "../../components/TypingDots";
import TypingMessage from "../../components/TypingMessage";

type DocumentItem = {
  document_id: string;
  name: string;
  size_bytes: number;
  status: "uploaded" | "ready";
};

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

const welcomeMessage: ChatMessage = {
  role: "assistant",
  content:
    "Welcome to ChatWithPDF. Ask any question about your document.",
};

const apiBase = (process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000").replace(/\/$/, "");

const apiUrl = (path: string): string => `${apiBase}${path}`;

function formatFetchError(error: unknown): string {
  if (error instanceof TypeError && error.message.toLowerCase().includes("failed to fetch")) {
    return `Failed to reach backend API at ${apiBase}. Ensure FastAPI is running and NEXT_PUBLIC_API_BASE is correct.`;
  }
  return error instanceof Error ? error.message : "Unexpected network error";
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [messagesByDocument, setMessagesByDocument] = useState<Record<string, ChatMessage[]>>({});

  const [uploading, setUploading] = useState(false);
  const [retrieving, setRetrieving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorText, setErrorText] = useState("");
  const sessionDocIds = useRef<Set<string>>(new Set());
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const selectedDocument = useMemo(
    () => documents.find((doc) => doc.document_id === selectedDocumentId),
    [documents, selectedDocumentId],
  );

  const activeMessages = useMemo(() => {
    if (!selectedDocumentId) {
      return [welcomeMessage];
    }
    return messagesByDocument[selectedDocumentId] ?? [welcomeMessage];
  }, [messagesByDocument, selectedDocumentId]);

  function appendMessage(documentId: string, message: ChatMessage) {
    setMessagesByDocument((prev) => {
      const currentThread = prev[documentId] ?? [welcomeMessage];
      return {
        ...prev,
        [documentId]: [...currentThread, message],
      };
    });
  }

  async function loadDocuments() {
    const res = await fetch(apiUrl("/documents"));
    if (!res.ok) {
      throw new Error("Unable to load documents");
    }
    const data = await res.json();
    const allDocs: DocumentItem[] = data.documents ?? [];
    const nextDocs = allDocs.filter((d) => sessionDocIds.current.has(d.document_id));
    setDocuments(nextDocs);
    if (!selectedDocumentId && nextDocs.length > 0) {
      setSelectedDocumentId(nextDocs[0].document_id);
    }
    return nextDocs;
  }

  async function autoProcessDocuments(docs: DocumentItem[]) {
    const uploaded = docs.filter((d) => d.status === "uploaded");
    for (const doc of uploaded) {
      try {
        await fetch(apiUrl("/api/process-existing"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document_id: doc.document_id }),
        });
      } catch {
       
      }
    }
    if (uploaded.length > 0) {
      await loadDocuments();
    }
  }

  async function deleteDocument(documentId: string) {
    try {
      const res = await fetch(apiUrl(`/documents/${documentId}`), { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Delete failed");
      }
      setMessagesByDocument((prev) => {
        const next = { ...prev };
        delete next[documentId];
        return next;
      });
      if (selectedDocumentId === documentId) {
        setSelectedDocumentId("");
      }
      await loadDocuments();
    } catch (err) {
      setErrorText(formatFetchError(err));
    }
  }

  function clearChat() {
    if (!selectedDocumentId) return;
    setMessagesByDocument((prev) => ({
      ...prev,
      [selectedDocumentId]: [welcomeMessage],
    }));
  }

  async function uploadPdf(file: File) {
    if (file.type !== "application/pdf") {
      setErrorText("Only PDF files are supported.");
      return;
    }

    setErrorText("");
    setStatusText("Processing PDF");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(apiUrl("/upload"), {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
      }

      const data = await res.json();
      sessionDocIds.current.add(data.document_id);
      setSelectedDocumentId(data.document_id);
      setStatusText(`Ready: ${data.document_name}`);
      await loadDocuments();
    } catch (err) {
      setErrorText(formatFetchError(err));
    } finally {
      setUploading(false);
    }
  }

  async function askQuestion() {
    const trimmed = question.trim();
    if (!trimmed || !selectedDocumentId) {
      return;
    }

    setQuestion("");
    setErrorText("");
    setRetrieving(true);
    const activeDocumentId = selectedDocumentId;
    appendMessage(activeDocumentId, { role: "user", content: trimmed });

    try {
      const res = await fetch(apiUrl("/ask"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_id: activeDocumentId,
          question: trimmed,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "RAG request failed");
      }

      const data = await res.json();
      appendMessage(activeDocumentId, { role: "assistant", content: data.answer });
      setTypingMessageId(`assistant-${(messagesByDocument[activeDocumentId]?.length ?? 1) + 1}`);
    } catch (err) {
      const message = formatFetchError(err);
      appendMessage(activeDocumentId, { role: "assistant", content: `Error: ${message}` });
    } finally {
      setRetrieving(false);
    }
  }


  useEffect(() => {
    const el = messagesRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [activeMessages, retrieving]);

  return (
    <main className="relative h-screen overflow-hidden p-4 md:p-6">
      <ParticleBackground className="pointer-events-none fixed inset-0 -z-20" />
      <div className="grid-pattern pointer-events-none fixed inset-0 -z-30 opacity-15" />

      <header className="mx-auto mb-4 flex w-full max-w-[1440px] items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brandPurple to-brandPink text-sm font-black">
            AI
          </div>
          <div>
            <p className="text-lg font-bold">ChatWithPDF</p>
            <p className="text-xs text-slate-300">Production RAG dashboard</p>
          </div>
        </div>
        <Link href="/" className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">
          Landing
        </Link>
      </header>

      <div className="mx-auto grid h-[calc(100vh-104px)] w-full max-w-[1440px] gap-5 lg:grid-cols-[350px_minmax(0,1fr)]">
        <section className="glass-panel flex flex-col overflow-hidden p-4 md:p-5">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) {
                void uploadPdf(dropped);
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            className={`relative mb-4 flex h-56 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-5 text-center transition ${
              dragging ? "border-brandBlue bg-brandBlue/10" : "border-brandPurple/35 bg-white/[0.02]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) {
                  void uploadPdf(selected);
                }
              }}
            />
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brandPurple/20">
              <span className="text-xl">↑</span>
            </div>
            <h2 className="text-xl font-semibold">Upload PDF</h2>
            <p className="mt-2 max-w-[280px] text-sm text-slate-300">Drag and drop your document, or click to browse.</p>
            {uploading ? <div className="mt-5 h-1.5 w-32 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/2 animate-pulse rounded-full bg-brandBlue" /></div> : null}
          </div>

          <div className="glass-panel flex min-h-0 flex-1 flex-col rounded-2xl border-white/5 bg-black/10 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">My Library</h3>
              <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-slate-300">
                {documents.length} files
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1">
              {documents.map((doc) => (
                <div
                  key={doc.document_id}
                  className={`group relative w-full rounded-xl border p-3 text-left transition ${
                    selectedDocumentId === doc.document_id
                      ? "border-brandPurple/60 bg-brandPurple/15"
                      : "border-white/10 bg-white/[0.04] hover:border-brandBlue/40"
                  }`}
                >
                  <button
                    onClick={() => setSelectedDocumentId(doc.document_id)}
                    className="w-full text-left"
                  >
                    <p className="truncate pr-7 text-sm font-semibold">{doc.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{(doc.size_bytes / (1024 * 1024)).toFixed(2)} MB</span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                          doc.status === "ready" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void deleteDocument(doc.document_id);
                    }}
                    className="absolute right-2 top-2 hidden rounded-lg p-1.5 text-slate-400 transition hover:bg-red-500/20 hover:text-red-300 group-hover:block"
                    aria-label="Delete document"
                    title="Delete document"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              ))}

              {documents.length === 0 ? <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">No documents yet.</div> : null}
            </div>
          </div>
        </section>

        <section className="glass-panel flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-5 py-4">
            <div>
              <h1 className="text-lg font-bold">AI Chat</h1>
              <p className="text-xs text-slate-300">Context: {selectedDocument?.name ?? "None"}</p>
            </div>
            <div className="flex items-center gap-2">
              {statusText ? <span className="rounded-full border border-brandBlue/30 bg-brandBlue/10 px-3 py-1 text-xs text-brandBlue">{statusText}</span> : null}
              {selectedDocumentId && activeMessages.length > 1 ? (
                <button
                  onClick={clearChat}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                  title="Clear chat"
                >
                  Clear Chat
                </button>
              ) : null}
            </div>
          </div>

          <div ref={messagesRef} className="relative flex-1 overflow-y-auto p-5">
            <AnimatePresence>
              {activeMessages.map((message, index) => (
                <motion.div
                  key={`${message.role}-${index}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`w-fit max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-brandPurple to-brandBlue text-white"
                        : "border border-white/10 bg-white/[0.05] text-slate-100"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 prose-pre:bg-white/10 prose-pre:rounded-lg prose-code:text-brandBlue prose-code:before:content-none prose-code:after:content-none prose-a:text-brandBlue prose-strong:text-white">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {retrieving ? (
              <div className="mb-3 inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-slate-400">
                <TypingDots />
              </div>
            ) : null}
          </div>

          <div className="border-t border-white/10 bg-black/20 p-4 md:p-5">
            {errorText ? <p className="mb-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">{errorText}</p> : null}
            <div className="relative flex items-end gap-2 rounded-2xl border border-brandPurple/35 bg-white/[0.03] p-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl p-3 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Attach file"
              >
                +
              </button>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void askQuestion();
                  }
                }}
                placeholder="Ask anything about the document..."
                rows={1}
                className="max-h-32 min-h-[48px] flex-1 resize-y bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                disabled={retrieving || uploading}
              />
              <button
                type="button"
                onClick={() => void askQuestion()}
                className="rounded-xl bg-gradient-to-r from-brandPurple to-brandBlue px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={retrieving || uploading || !selectedDocumentId || !question.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
