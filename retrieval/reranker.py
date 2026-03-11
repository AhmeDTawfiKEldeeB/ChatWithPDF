from langchain_core.documents import Document



def _tokenize(text: str) -> set[str]:
    return {token.lower() for token in text.split() if len(token) > 2}



def rerank_documents(query: str, documents: list[Document], top_n: int = 4) -> list[Document]:
    query_tokens = _tokenize(query)

    scored = []
    for doc in documents:
        doc_tokens = _tokenize(doc.page_content)
        overlap = len(query_tokens.intersection(doc_tokens))
        scored.append((overlap, doc))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [doc for _, doc in scored[:top_n]]
