"""Extração de texto de arquivos enviados pelo usuário (PDF ou TXT)."""
import fitz  # PyMuPDF


class ExtractionError(Exception):
    """Erro ao extrair texto de um documento."""


def extract_text(content: bytes, content_type: str, filename: str) -> str:
    extension = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    if extension == "pdf" or content_type == "application/pdf":
        return _extract_pdf(content)
    if extension == "txt" or content_type == "text/plain":
        return _extract_txt(content)

    raise ExtractionError(f"Tipo de arquivo não suportado: {content_type}")


def _extract_pdf(content: bytes) -> str:
    try:
        doc = fitz.open(stream=content, filetype="pdf")
    except Exception as exc:  # PyMuPDF lança exceções genéricas
        raise ExtractionError(f"Não foi possível abrir o PDF: {exc}") from exc

    try:
        if doc.is_encrypted:
            raise ExtractionError("O PDF está protegido por senha")
        pages = [page.get_text() for page in doc]
    finally:
        doc.close()

    return "\n\n".join(pages)


def _extract_txt(content: bytes) -> str:
    for encoding in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise ExtractionError("Não foi possível decodificar o arquivo de texto")
