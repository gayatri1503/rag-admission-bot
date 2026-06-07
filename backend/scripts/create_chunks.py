import pandas as pd
from pathlib import Path

# Maps short category codes to human readable names
CATEGORY_MAP = {
    'GOPENS': 'General Open (State Level)',
    'GSCS': 'General SC (State Level)',
    'GSTS': 'General ST (State Level)',
    'GVJS': 'General VJ/DT (State Level)',
    'GNT1S': 'General NT1 (State Level)',
    'GNT2S': 'General NT2 (State Level)',
    'GNT3S': 'General NT3 (State Level)',
    'GOBCS': 'General OBC (State Level)',
    'GSEBCS': 'General SEBC (State Level)',
    'LOPENS': 'Ladies Open (State Level)',
    'LSCS': 'Ladies SC (State Level)',
    'LSTS': 'Ladies ST (State Level)',
    'LVJS': 'Ladies VJ/DT (State Level)',
    'LNT1S': 'Ladies NT1 (State Level)',
    'LNT2S': 'Ladies NT2 (State Level)',
    'LNT3S': 'Ladies NT3 (State Level)',
    'LOBCS': 'Ladies OBC (State Level)',
    'LSEBCS': 'Ladies SEBC (State Level)',
    'PWDOPENS': 'PWD Open (State Level)',
    'PWDOBCS': 'PWD OBC (State Level)',
    'DEFOPENS': 'Defence Open (State Level)',
    'DEFOBCS': 'Defence OBC (State Level)',
    'TFWS': 'Tuition Fee Waiver Scheme',
    'PWDRSCS': 'PWD SC (State Level)',
    'DEFROBCS': 'Defence OBC (State Level)',
    'ORPHAN': 'Orphan Category',
    'EWS': 'Economically Weaker Section',
    'GOPENH': 'General Open (Home University)',
    'GSCH': 'General SC (Home University)',
    'GSTH': 'General ST (Home University)',
    'GOBCH': 'General OBC (Home University)',
    'LOPENH': 'Ladies Open (Home University)',
    'LOBCH': 'Ladies OBC (Home University)',
    'LSCH': 'Ladies SC (Home University)',
}

def get_category_name(code):
    """Return human readable category name or the code itself if not found"""
    return CATEGORY_MAP.get(code.strip(), code.strip())

def create_mh_chunks(df):
    """Convert MH cutoff records into readable text chunks"""
    chunks = []

    branch_aliases = {
        'Computer Science and Engineering': 'CS CSE Computer Science',
        'Information Technology': 'IT Information Technology',
        'Electronics and Telecommunication Engg': 'EXTC Electronics Telecommunication',
        'Mechanical Engineering': 'Mechanical MECH',
        'Civil Engineering': 'Civil CE',
        'Electrical Engineering': 'Electrical EE',
        'Computer Engineering': 'CS CSE Computer',
        'Artificial Intelligence': 'AI Artificial Intelligence',
        'Data Science': 'DS Data Science',
    }

    for _, row in df.iterrows():
        category_name = get_category_name(str(row['category']))
        college_short = str(row['college_name']).split(',')[0].strip()
        branch_alias = branch_aliases.get(str(row['branch_name']), '')

        city = ''
        if ',' in str(row['college_name']):
            city = str(row['college_name']).split(',')[-1].strip()

        chunk = (
            f"In {row['year']} CAP Round {row['round']}, "
            f"{row['college_name']} ({college_short}) offered {row['branch_name']} {branch_alias} "
            f"with a closing percentile of {row['percentile']:.2f} "
            f"for the {category_name} ({row['category']}) category. "
            f"The closing rank was {row['rank']}. "
            f"Location: {city}, Maharashtra. "
            f"Year: {row['year']}, Round: {row['round']}."
        )

        chunks.append({
            'text': chunk,
            'year': str(row['year']),
            'round': str(row['round']),
            'type': 'MH',
            'college_name': str(row['college_name']),
            'branch_name': str(row['branch_name']),
            'category': str(row['category']),
            'percentile': float(row['percentile'])
        })

    return chunks

def create_ai_chunks(df):
    """Convert AI cutoff records into readable text chunks"""
    chunks = []

    for _, row in df.iterrows():
        chunk = (
            f"In {row['year']} CAP Round {row['round']}, "
            f"{row['institute_name']} offered {row['course_name']} "
            f"for All India seats with a closing percentile of {row['percentile']:.2f}. "
            f"The All India Merit rank was {int(row['rank']) if pd.notna(row['rank']) else 'N/A'}. "
            f"Exam: {row['merit_exam']}. "
            f"This is All India quota data."
        )

        chunks.append({
            'text': chunk,
            'year': str(row['year']),
            'round': str(row['round']),
            'type': 'AI',
            'college_name': str(row['institute_name']),
            'branch_name': str(row['course_name']),
            'category': 'AI',
            'percentile': float(row['percentile'])
        })

    return chunks

if __name__ == "__main__":
    processed_path = Path(__file__).parent.parent / 'data' / 'processed'

    print("Loading MH data...")
    mh_df = pd.read_csv(processed_path / 'mh_cutoffs.csv')
    print(f"MH records: {len(mh_df)}")

    print("Loading AI data...")
    ai_df = pd.read_csv(processed_path / 'ai_cutoffs.csv')
    print(f"AI records: {len(ai_df)}")

    print("\nCreating MH chunks...")
    mh_chunks = create_mh_chunks(mh_df)
    print(f"MH chunks created: {len(mh_chunks)}")

    print("Creating AI chunks...")
    ai_chunks = create_ai_chunks(ai_df)
    print(f"AI chunks created: {len(ai_chunks)}")

    all_chunks = mh_chunks + ai_chunks
    print(f"\nTotal chunks: {len(all_chunks)}")

    # Save chunks to CSV
    chunks_df = pd.DataFrame(all_chunks)
    output_file = processed_path / 'chunks.csv'
    chunks_df.to_csv(output_file, index=False)
    print(f"Saved to: {output_file}")

    # Show sample chunks
    print("\nSample MH chunk:")
    print(mh_chunks[0]['text'])
    print("\nSample AI chunk:")
    print(ai_chunks[0]['text'])