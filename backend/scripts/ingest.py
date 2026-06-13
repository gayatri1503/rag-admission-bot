import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))
from config import INGEST_YEARS, INGEST_ROUNDS, INGEST_CATEGORIES

# Use config values instead of hardcoded lists
KEEP_YEARS = INGEST_YEARS
KEEP_ROUNDS = INGEST_ROUNDS
KEEP_CATEGORIES = INGEST_CATEGORIES

def load_filtered_chunks(processed_path):
    print("Loading chunks...")
    df = pd.read_csv(processed_path / 'chunks.csv')
    
    filtered = df[
        (df['year'].isin(KEEP_YEARS)) &
        (df['round'].isin(KEEP_ROUNDS)) &
        (df['category'].isin(KEEP_CATEGORIES))
    ].reset_index(drop=True)
    
    print(f"Filtered chunks: {len(filtered)}")
    return filtered

def ingest(processed_path, chroma_path):
    # Load filtered chunks
    df = load_filtered_chunks(processed_path)
    
    # Load embedding model
    # all-MiniLM-L6-v2 is small (80MB), fast, works well for this use case
    print("\nLoading embedding model...")
    print("First run will download ~80MB model. Please wait...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("Model loaded.")
    
    # Connect to ChromaDB
    print("\nConnecting to ChromaDB...")
    client = chromadb.PersistentClient(path=str(chroma_path))
    
    # Delete existing collection if it exists so we start fresh
    try:
        client.delete_collection("admission_data")
        print("Deleted existing collection.")
    except:
        pass
    
    # Create fresh collection
    collection = client.create_collection(
        name="admission_data",
        metadata={"hnsw:space": "cosine"}
    )
    print("Created collection: admission_data")
    
    # Embed and store in batches
    # We use batches of 500 to avoid memory issues on low RAM machines
    batch_size = 500
    total = len(df)
    
    print(f"\nEmbedding and storing {total} chunks in batches of {batch_size}...")
    print("This will take 15-25 minutes on CPU. Please don't close the terminal.\n")
    
    start_time = time.time()
    
    for i in range(0, total, batch_size):
        batch = df.iloc[i:i+batch_size]
        
        texts = batch['text'].tolist()
        ids = [f"chunk_{j}" for j in range(i, i + len(batch))]
        
        metadatas = []
        for _, row in batch.iterrows():
            metadatas.append({
                'year': str(row['year']),
                'round': str(row['round']),
                'type': str(row['type']),
                'college_name': str(row['college_name']),
                'branch_name': str(row['branch_name']),
                'category': str(row['category']),
                'percentile': float(row['percentile'])
            })
        
        # Generate embeddings for this batch
        embeddings = model.encode(texts, show_progress_bar=False).tolist()
        
        # Store in ChromaDB
        collection.add(
            documents=texts,
            embeddings=embeddings,
            ids=ids,
            metadatas=metadatas
        )
        
        # Progress update every 10 batches
        if (i // batch_size) % 10 == 0:
            elapsed = time.time() - start_time
            progress = (i + len(batch)) / total * 100
            print(f"Progress: {progress:.1f}% | {i + len(batch)}/{total} chunks | {elapsed:.0f}s elapsed")
    
    elapsed = time.time() - start_time
    print(f"\nDone! Stored {total} chunks in ChromaDB.")
    print(f"Total time: {elapsed:.0f} seconds")
    print(f"ChromaDB stored at: {chroma_path}")
    
    # Quick verification
    count = collection.count()
    print(f"Verified: {count} chunks in collection")

if __name__ == "__main__":
    processed_path = Path(__file__).parent.parent / 'data' / 'processed'
    chroma_path = Path(__file__).parent.parent / 'chroma_db'
    
    ingest(processed_path, chroma_path)


    