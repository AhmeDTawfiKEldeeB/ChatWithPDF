from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter



def chunk_documents(
    documents: list[Document], chunk_size: int = 800, chunk_overlap: int = 120
) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return splitter.split_documents(documents)
