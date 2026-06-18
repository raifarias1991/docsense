"""Geração de embeddings via fastembed (ONNX Runtime).

Escolhido no lugar de sentence-transformers (que exige PyTorch, ~2GB de
dependências) para manter a imagem Docker pequena e o cold start rápido
em planos gratuitos de hospedagem (Render, Railway, etc.).

Usa um modelo multilíngue (intfloat/multilingual-e5-small) para suportar
bem português. Modelos da família E5 esperam prefixos "query: " e
"passage: " nos textos — omitir isso reduz bastante a qualidade da busca.
"""
from functools import lru_cache

from fastembed import TextEmbedding

from app.core.config import get_settings

settings = get_settings()

EMBEDDING_DIM = 384  # dimensão do intfloat/multilingual-e5-small


@lru_cache(maxsize=1)
def _get_model() -> TextEmbedding:
    # Download do modelo (na primeira execução) é feito automaticamente
    # pelo fastembed a partir do Hugging Face Hub.
    return TextEmbedding(model_name=settings.embedding_model)


def embed_documents(texts: list[str]) -> list[list[float]]:
    model = _get_model()
    prefixed = [f"passage: {t}" for t in texts]
    return [vector.tolist() for vector in model.embed(prefixed)]


def embed_query(text: str) -> list[float]:
    model = _get_model()
    vector = next(iter(model.embed([f"query: {text}"])))
    return vector.tolist()
