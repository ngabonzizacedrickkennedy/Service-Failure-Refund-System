import io
from urllib.parse import urlparse

import httpx


def extract_text_from_url(url: str) -> str | None:
    """Download a CV file from a presigned S3 URL and extract its text content."""
    try:
        resp = httpx.get(url, timeout=30, follow_redirects=True)
        if resp.status_code != 200:
            print(f"[CV Parser] Download failed: HTTP {resp.status_code}")
            return None

        path = urlparse(url).path.lower()

        if path.endswith(".pdf"):
            return _extract_pdf(resp.content)
        elif path.endswith(".docx"):
            return _extract_docx(resp.content)
        elif path.endswith(".doc"):
            print("[CV Parser] .doc (old Word format) is not supported — only .pdf and .docx are.")
            return None
        else:
            print(f"[CV Parser] Unrecognised file type in path: {path}")
            return None
    except Exception as e:
        print(f"[CV Parser] Error fetching/parsing CV file: {e}")
        return None


def _extract_pdf(content: bytes) -> str | None:
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            pages = [page.extract_text() for page in pdf.pages]
            text = "\n".join(p.strip() for p in pages if p and p.strip())
            return text if text else None
    except Exception as e:
        print(f"[CV Parser] PDF extraction error: {e}")
        return None


def _extract_docx(content: bytes) -> str | None:
    try:
        from docx import Document
        doc = Document(io.BytesIO(content))
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs) if paragraphs else None
    except Exception as e:
        print(f"[CV Parser] DOCX extraction error: {e}")
        return None
