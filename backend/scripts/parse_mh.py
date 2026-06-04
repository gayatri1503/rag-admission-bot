import pdfplumber
import pandas as pd
import re
import os
from pathlib import Path

# Pattern to identify college lines like "01002 - Government College of Engineering, Amravati"
COLLEGE_PATTERN = re.compile(r'^(\d{5})\s*-\s*(.+)$')

# Pattern to identify branch lines like "0100219110 - Civil Engineering"
BRANCH_PATTERN = re.compile(r'^(\d{10})\s*-\s*(.+)$')

def parse_cell(cell_value):
    """
    Each cell looks like: '37591\n(88.9550679)'
    We want to extract: rank=37591, percentile=88.9550679
    """
    if cell_value is None:
        return None, None
    
    # Remove newlines and split
    text = str(cell_value).strip()
    
    # Extract number in brackets as percentile
    percentile_match = re.search(r'\(([0-9.]+)\)', text)
    percentile = float(percentile_match.group(1)) if percentile_match else None
    
    # Extract rank - first number before the bracket
    rank_match = re.search(r'^([0-9]+)', text)
    rank = int(rank_match.group(1)) if rank_match else None
    
    return rank, percentile

def parse_mh_pdf(pdf_path, year, round_num):
    """
    Parse one MH PDF and return a list of records.
    Each record = one category for one branch of one college.
    """
    records = []
    
    current_college_code = None
    current_college_name = None
    current_branch_code = None
    current_branch_name = None
    
    print(f"Parsing: {pdf_path}")
    
    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        print(f"Total pages: {total_pages}")
        
        for page_num, page in enumerate(pdf.pages):
            # Extract raw text to find college and branch headers
            text = page.extract_text()
            if not text:
                continue
            
            # Go line by line to find college and branch names
            for line in text.split('\n'):
                line = line.strip()
                
                college_match = COLLEGE_PATTERN.match(line)
                if college_match:
                    current_college_code = college_match.group(1)
                    current_college_name = college_match.group(2).strip()
                    continue
                
                branch_match = BRANCH_PATTERN.match(line)
                if branch_match:
                    current_branch_code = branch_match.group(1)
                    current_branch_name = branch_match.group(2).strip()
                    continue
            
            # Now extract tables from this page
            tables = page.extract_tables()
            
            for table in tables:
                if len(table) < 2:
                    continue
                
                # First row is category headers
                headers = table[0]
                
                # Second row is the data
                data_row = table[1]
                
                # Skip if no college or branch found yet
                if not current_college_code or not current_branch_code:
                    continue
                
                # Loop through each category column
                for col_idx, category in enumerate(headers):
                    if category is None or category.strip() == '':
                        continue
                    
                    # Skip the Stage column
                    if category.strip().upper() == 'STAGE':
                        continue
                    
                    # Get the cell value for this category
                    if col_idx >= len(data_row):
                        continue
                        
                    cell_value = data_row[col_idx]
                    rank, percentile = parse_cell(cell_value)
                    
                    if percentile is None:
                        continue
                    
                    records.append({
                        'year': year,
                        'round': round_num,
                        'type': 'MH',
                        'college_code': current_college_code,
                        'college_name': current_college_name,
                        'branch_code': current_branch_code,
                        'branch_name': current_branch_name,
                        'category': category.strip().replace('\n', ''),
                        'rank': rank,
                        'percentile': percentile
                    })
        
    print(f"Extracted {len(records)} records from {pdf_path}")
    return records

def parse_all_mh(base_path):
    """
    Loop through all years and rounds and parse every MH PDF.
    """
    all_records = []
    years = ['2022', '2023', '2024', '2025']
    
    for year in years:
        mh_path = Path(base_path) / year / 'MH'
        
        if not mh_path.exists():
            print(f"Skipping {mh_path} - not found")
            continue
        
        # Find all CAP round PDFs in this folder
        pdf_files = sorted(mh_path.glob('CAP-*.pdf'))
        
        for pdf_file in pdf_files:
            # Extract round number from filename like CAP-1.pdf
            round_num = int(re.search(r'CAP-(\d+)', pdf_file.name).group(1))
            
            records = parse_mh_pdf(str(pdf_file), year, round_num)
            all_records.extend(records)
    
    return all_records

if __name__ == "__main__":
    # Path to your raw data folder
    base_path = Path(__file__).parent.parent / 'data' / 'raw'
    output_path = Path(__file__).parent.parent / 'data' / 'processed'
    
    print("Starting MH PDF parsing...")
    print(f"Reading from: {base_path}")
    
    # Parse all MH PDFs
    records = parse_all_mh(base_path)
    
    print(f"\nTotal records extracted: {len(records)}")
    
    # Save to CSV
    df = pd.DataFrame(records)
    output_file = output_path / 'mh_cutoffs.csv'
    df.to_csv(output_file, index=False)
    
    print(f"Saved to: {output_file}")
    print("\nSample data:")
    print(df.head(10).to_string())