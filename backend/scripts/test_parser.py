from pathlib import Path
from parse_mh import parse_mh_pdf

pdf_path = Path('..') / 'data' / 'raw' / '2025' / 'MH' / 'CAP-1.pdf'
records = parse_mh_pdf(str(pdf_path), year='2025', round_num=1)

colleges = set(r['college_name'] for r in records)
branches = set(r['branch_name'] for r in records)
categories = set(r['category'] for r in records)

print(f'Unique colleges: {len(colleges)}')
print(f'Unique branches: {len(branches)}')
print(f'Unique categories: {len(categories)}')
print()
print('Sample categories:', list(categories)[:10])