from app.services.ingestion.chunker import chunk_text


def test_chunk_text_basic_split():
    text = "a" * 2500
    chunks = chunk_text(text, chunk_size=1000, chunk_overlap=150)

    assert len(chunks) > 1
    # índices sequenciais começando em 0
    assert [c.index for c in chunks] == list(range(len(chunks)))


def test_chunk_text_offsets_match_original_text():
    text = (
        "Parágrafo um.\n\n"
        "Parágrafo dois com mais conteúdo para garantir múltiplos trechos.\n\n"
        "Parágrafo três."
    )
    chunks = chunk_text(text, chunk_size=40, chunk_overlap=10)

    for chunk in chunks:
        assert text[chunk.char_start:chunk.char_end] == chunk.text


def test_chunk_text_empty_string_returns_no_chunks():
    assert chunk_text("", chunk_size=1000, chunk_overlap=150) == []


def test_chunk_text_short_text_single_chunk():
    text = "Texto curto que cabe em um único chunk."
    chunks = chunk_text(text, chunk_size=1000, chunk_overlap=150)

    assert len(chunks) == 1
    assert chunks[0].text == text
    assert chunks[0].char_start == 0
    assert chunks[0].char_end == len(text)
