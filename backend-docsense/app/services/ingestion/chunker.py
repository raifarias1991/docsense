"""Divide texto longo em trechos (chunks) menores, preservando os offsets
de caractere no texto original — necessário para exibir char_start/char_end
nos resultados de busca.
"""
from dataclasses import dataclass

from langchain_text_splitters import RecursiveCharacterTextSplitter


@dataclass
class TextChunk:
    index: int
    text: str
    char_start: int
    char_end: int


def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 150) -> list[TextChunk]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    raw_chunks = [c.strip() for c in splitter.split_text(text) if c.strip()]

    chunks: list[TextChunk] = []
    cursor = 0
    for i, chunk in enumerate(raw_chunks):
        # Procura a partir de um pouco antes do cursor para tolerar overlap
        start = text.find(chunk, max(0, cursor - chunk_overlap))
        if start == -1:
            start = text.find(chunk)
        if start == -1:
            # Não deveria ocorrer (chunk vem do próprio texto), mas evita crash
            start = cursor
        end = start + len(chunk)
        chunks.append(TextChunk(index=i, text=chunk, char_start=start, char_end=end))
        cursor = start + 1

    return chunks
