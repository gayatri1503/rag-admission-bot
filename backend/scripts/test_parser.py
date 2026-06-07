import pandas as pd
from pathlib import Path

processed_path = Path(__file__).parent.parent / 'data' / 'processed'
df = pd.read_csv(processed_path / 'mh_cutoffs.csv')

# Search all branches containing 'computer' across all colleges
computer = df[df['branch_name'].str.contains('Computer', case=False, na=False)]

print(f"Total Computer branches: {len(computer)}")
print(f"\nUnique branch names containing Computer:")
print(computer['branch_name'].unique())
print(f"\nColleges with CS that have high cutoffs (percentile > 95):")
high = computer[
    (computer['category'] == 'GOPENS') & 
    (computer['percentile'] > 95) &
    (computer['year'] == 2025)
]
print(high[['college_name', 'branch_name', 'percentile']].sort_values('percentile', ascending=False).head(10).to_string())