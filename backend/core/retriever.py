import chromadb
from sentence_transformers import SentenceTransformer
from pathlib import Path
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

CHROMA_PATH = Path(__file__).parent.parent / 'chroma_db'

print("Loading embedding model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model ready.")

client = chromadb.PersistentClient(path=str(CHROMA_PATH))
collection = client.get_collection("admission_data")

def detect_filters(query_lower, expanded_query):
    """
    Detect if query mentions a specific college or category
    and return ChromaDB metadata filters
    """
    from expander import COLLEGE_ALIASES, CATEGORY_ALIASES

    filters = {}

    # Check if a specific college is mentioned
    for alias, full_name in COLLEGE_ALIASES.items():
        if alias in query_lower:
            filters['college_name'] = full_name
            break

    return filters if filters else None

def retrieve(query, n_results=5, filters=None):
    query_embedding = model.encode(query).tolist()

    search_kwargs = {
        "query_embeddings": [query_embedding],
        "n_results": n_results,
        "include": ["documents", "metadatas", "distances"]
    }

    if filters:
        search_kwargs["where"] = filters

    results = collection.query(**search_kwargs)

    chunks = []
    for i in range(len(results['documents'][0])):
        chunks.append({
            'text': results['documents'][0][i],
            'metadata': results['metadatas'][0][i],
            'relevance_score': 1 - results['distances'][0][i]
        })

    return chunks

def retrieve_with_expansion(user_query, n_results=5):
    """
    Full pipeline — expand query then retrieve with smart filters
    """
    from expander import expand_query

    query_lower = user_query.lower()

    # Expand the query
    expanded = expand_query(user_query)

    # Detect filters from original query
    filters = detect_filters(query_lower, expanded)

    print(f"Filters applied: {filters}")

    # Try filtered search first
    if filters:
        try:
            results = retrieve(expanded, n_results=n_results, filters=filters)
            if results:
                return results
        except Exception as e:
            print(f"Filtered search failed: {e}, falling back to unfiltered")

    # Fall back to unfiltered if no filters or filtered returned nothing
    return retrieve(expanded, n_results=n_results)

if __name__ == "__main__":
    test_queries = [
        "COEP CS cutoff general 2025",
        "vjti mechanical obc cutoff",
        "colleges with 85 percentile sc category",
    ]

    for query in test_queries:
        print(f"\nQuery: {query}")
        results = retrieve_with_expansion(query, n_results=3)
        print()
        for i, chunk in enumerate(results):
            print(f"Result {i+1} (relevance: {chunk['relevance_score']:.3f}):")
            print(chunk['text'])
            print()