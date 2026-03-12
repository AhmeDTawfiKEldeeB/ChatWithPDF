from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableConfig
try:
    from langsmith import traceable
except Exception:  # pragma: no cover
    def traceable(*args, **kwargs):
        def _wrap(func):
            return func
        return _wrap

from rag.prompt import get_rag_prompt
from retrieval.reranker import rerank_documents


def _get_tracing_config() -> RunnableConfig:
    """Return a RunnableConfig with LangSmith tracer if tracing is enabled."""
    import os
    tracing_enabled = (
        os.environ.get("LANGCHAIN_TRACING_V2", "").lower() == "true"
        or os.environ.get("LANGSMITH_TRACING", "").lower() == "true"
    )
    if tracing_enabled:
        from langchain_core.tracers.langchain import LangChainTracer
        project = os.environ.get("LANGCHAIN_PROJECT") or os.environ.get("LANGSMITH_PROJECT") or "default"
        tracer = LangChainTracer(project_name=project)
        return RunnableConfig(callbacks=[tracer])
    return RunnableConfig()



def _format_docs(docs: list[Document]) -> str:
    return "\n\n".join(doc.page_content for doc in docs)



def build_rag_chain(retriever, llm):
    prompt = get_rag_prompt()
    return (
        {
            "context": retriever | _format_docs,
            "question": RunnablePassthrough(),
        }
        | prompt
        | llm
        | StrOutputParser()
    )



@traceable(name="answer_with_rerank", run_type="chain")
def answer_with_rerank(query: str, retriever, llm, top_n: int = 4) -> tuple[str, list[Document]]:
    docs = retriever.invoke(query)
    reranked = rerank_documents(query, docs, top_n=top_n)
    prompt = get_rag_prompt()
    chain = prompt | llm | StrOutputParser()
    config = _get_tracing_config()
    answer = chain.invoke({"question": query, "context": _format_docs(reranked)}, config=config)
    return answer, reranked
