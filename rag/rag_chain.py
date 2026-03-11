from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

from rag.prompt import get_rag_prompt
from retrieval.reranker import rerank_documents



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



def answer_with_rerank(query: str, retriever, llm, top_n: int = 4) -> tuple[str, list[Document]]:
    docs = retriever.invoke(query)
    reranked = rerank_documents(query, docs, top_n=top_n)
    prompt = get_rag_prompt()
    chain = prompt | llm | StrOutputParser()
    answer = chain.invoke({"question": query, "context": _format_docs(reranked)})
    return answer, reranked
