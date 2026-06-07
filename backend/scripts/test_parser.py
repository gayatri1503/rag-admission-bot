import pandas as pd
from pathlib import Path

processed_path = Path(__file__).parent.parent / 'data' / 'processed'
df = pd.read_csv(processed_path / 'chunks.csv')

# Find COEP in MH data
coep = df[
    (df['college_name'].str.contains('COEP', case=False, na=False)) |
    (df['college_name'].str.contains('College of Engineering, Pune', case=False, na=False))
]

print(f"COEP records found: {len(coep)}")
print("\nUnique college names matching COEP:")
print(coep['college_name'].unique())