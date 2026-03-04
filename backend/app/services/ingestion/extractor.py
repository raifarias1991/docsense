from pathlib import Path
import pymupdf  # PyMuPDF


def extract_text(file_path: str, content_type: str) -> str:
    """Extract text from PDF or TXT files."""
    if content_type == "application/pdf":
        return _extract_pdf(file_path)
    return _extract_txt(file_path)


def _extract_pdf(file_path: str) -> str:
    doc = pymupdf.open(file_path)
    pages = []
    for page in doc:
        text = page.get_text()
        if text.strip():
            pages.append(text)
    doc.close()
    return "\n\n".join(pages)


def _extract_txt(file_path: str) -> str:
    return Path(file_path).read_text(encoding="utf-8", errors="replace")
