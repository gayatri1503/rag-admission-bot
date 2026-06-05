import pdfplumber
import pandas as pd
import re
from pathlib import Path

def parse_ai_pdf(pdf_path, year, round_num):
    records = []
    print(f"Parsing: {pdf_path}")

    with pdfplumber.open(pdf_path) as pdf:
        print(f"Total pages: {len(pdf.pages)}")

        for page in pdf.pages:
            tables = page.extract_tables()

            for table in tables:
                if not table or len(table) < 2:
                    continue

                # Check if this is the right table by looking at headers
                headers = [str(h).strip() if h else '' for h in table[0]]

                # Skip if it doesn't look like the cutoff table
                if 'Institute Name' not in headers and 'Course Name' not in headers:
                    continue

                # Process each data row
                for row in table[1:]:
                    if not row or len(row) < 5:
                        continue

                    # Skip empty rows
                    if not any(row):
                        continue

                    try:
                        # Extract All India Merit and percentile
                        # Format is like "15312 (86.6844102)"
                        merit_raw = str(row[1]).strip() if row[1] else ''
                        rank_match = re.search(r'^(\d+)', merit_raw)
                        percentile_match = re.search(r'\(([0-9.]+)\)', merit_raw)

                        rank = int(rank_match.group(1)) if rank_match else None
                        percentile = float(percentile_match.group(1)) if percentile_match else None

                        institute_name = str(row[3]).strip() if row[3] else ''
                        course_name = str(row[4]).strip() if row[4] else ''
                        merit_exam = str(row[5]).strip() if len(row) > 5 and row[5] else ''

                        # Skip header rows that appear mid-table
                        if institute_name == 'Institute Name':
                            continue

                        if not institute_name or not course_name:
                            continue

                        records.append({
                            'year': year,
                            'round': round_num,
                            'type': 'AI',
                            'institute_name': institute_name,
                            'course_name': course_name,
                            'merit_exam': merit_exam,
                            'rank': rank,
                            'percentile': percentile
                        })

                    except Exception:
                        continue

    print(f"Extracted {len(records)} records from {pdf_path}")
    return records

def parse_all_ai(base_path):
    all_records = []
    years = ['2022', '2023', '2024', '2025']

    for year in years:
        ai_path = Path(base_path) / year / 'AI'

        if not ai_path.exists():
            print(f"Skipping {ai_path} - not found")
            continue

        pdf_files = sorted(ai_path.glob('CAP-*.pdf'))

        for pdf_file in pdf_files:
            round_num = int(re.search(r'CAP-(\d+)', pdf_file.name).group(1))
            records = parse_ai_pdf(str(pdf_file), year, round_num)
            all_records.extend(records)

    return all_records

if __name__ == "__main__":
    base_path = Path(__file__).parent.parent / 'data' / 'raw'
    output_path = Path(__file__).parent.parent / 'data' / 'processed'

    print("Starting AI PDF parsing...")
    print(f"Reading from: {base_path}")

    records = parse_all_ai(base_path)

    print(f"\nTotal records extracted: {len(records)}")

    df = pd.DataFrame(records)
    output_file = output_path / 'ai_cutoffs.csv'
    df.to_csv(output_file, index=False)

    print(f"Saved to: {output_file}")
    print("\nSample data:")
    print(df.head(5).to_string())