from dataclasses import dataclass
from langchain_text_splitters import RecursiveCharacterTextSplitter


@dataclass
class Chunk:
    text: str
    index: int
    char_start: int
    char_end: int


def chunk_text(text: str, chunk_size: int = 256, overlap: int = 32) -> list[Chunk]:
    """
    Divide texto em chunks respeitando parágrafos e frases.
    chunk_size=256 — melhor granularidade para RAG (Context Recall 0.90).
    overlap=32 — continuidade de contexto entre chunks.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=overlap,
        separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""],
        length_function=len,
    )
    raw_chunks = splitter.split_text(text)
    chunks = []
    cursor = 0
    for i, chunk_text_str in enumerate(raw_chunks):
        start = text.find(chunk_text_str, cursor)
        if start == -1:
            start = cursor
        end = start + len(chunk_text_str)
        chunks.append(Chunk(
            text=chunk_text_str,
            index=i,
            char_start=start,
            char_end=end,
        ))
        cursor = max(cursor, start)
    return chunks
