import io
from pypdf import PdfReader

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """
    Extracts text from PDF bytes using pypdf.
    """
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        extracted_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"
        
        return extracted_text.strip()
    except Exception as e:
        raise ValueError(f"Failed to parse PDF file: {str(e)}")
