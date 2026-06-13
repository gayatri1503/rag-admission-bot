import chromadb
from pathlib import Path

chroma_path = Path(__file__).parent.parent / 'chroma_db'
client = chromadb.PersistentClient(path=str(chroma_path))
collection = client.get_collection("admission_data")

# Check what type values exist in metadata
results = collection.get(limit=5, include=["metadatas"])
print("Sample metadata:")
for m in results['metadatas']:
    print(m)