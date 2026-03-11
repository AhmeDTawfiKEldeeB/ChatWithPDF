from langchain_core.vectorstores import VectorStoreRetriever



def build_retriever(vector_store, k: int = 4) -> VectorStoreRetriever:
    return vector_store.as_retriever(search_kwargs={"k": k})
