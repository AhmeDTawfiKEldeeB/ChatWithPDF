from langchain_core.prompts import ChatPromptTemplate

RAG_TEMPLATE = """You are a precise assistant for question-answering over PDF documents.
Use the provided context only.
If the answer is not in context, clearly say you do not know.
Keep answers concise and factual.

Question:
{question}

Context:
{context}

Answer:
"""



def get_rag_prompt() -> ChatPromptTemplate:
    return ChatPromptTemplate.from_template(RAG_TEMPLATE)
