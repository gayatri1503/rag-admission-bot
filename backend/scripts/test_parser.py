import pandas as pd
from pathlib import Path

processed_path = Path(__file__).parent.parent / 'data' / 'processed'
df = pd.read_csv(processed_path / 'chunks.csv')

# Define our filter
keep_years = [2024, 2025]
keep_rounds = [1]
keep_categories = [
    'GOPENS', 'GSCS', 'GSTS', 'GOBCS', 'GSEBCS',
    'LOPENS', 'TFWS', 'EWS', 'GNT1S', 'GNT2S',
    'GNT3S', 'GVJS', 'LOBCS', 'AI'
]

filtered = df[
    (df['year'].isin(keep_years)) &
    (df['round'].isin(keep_rounds)) &
    (df['category'].isin(keep_categories))
]

print(f"Original chunks: {len(df)}")
print(f"Filtered chunks: {len(filtered)}")
print(f"\nCategory breakdown:")
print(filtered['category'].value_counts())
print(f"\nYear breakdown:")
print(filtered['year'].value_counts())




