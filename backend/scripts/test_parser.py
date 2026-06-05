import pdfplumber
from pathlib import Path

pdf_path = Path(__file__).parent.parent / 'data' / 'raw' / '2022' / 'MH' / 'CAP-1.pdf'

with pdfplumber.open(str(pdf_path)) as pdf:
    print(pdf.pages[0].extract_text()[:2000])