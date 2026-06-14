import chromadb
import os
import google.generativeai as genai
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

CHROMA_PATH = Path(__file__).parent.parent / 'chroma_db'

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print("Connecting to ChromaDB...")
client = chromadb.PersistentClient(path=str(CHROMA_PATH))
collection = client.get_collection("admission_data")
print("ChromaDB ready.")

def get_embedding(text):
    """Get embedding using Gemini API"""
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="retrieval_query"
    )
    return result['embedding']

def retrieve(query, n_results=5, where=None):
    query_embedding = get_embedding(query)

    fetch_count = min(n_results * 4, 100)

    search_kwargs = {
        "query_embeddings": [query_embedding],
        "n_results": fetch_count,
        "include": ["documents", "metadatas", "distances"]
    }

    if where:
        search_kwargs["where"] = where

    results = collection.query(**search_kwargs)

    seen_colleges = {}
    chunks = []

    for i in range(len(results['documents'][0])):
        college = results['metadatas'][0][i].get('college_name', '')
        score = 1 - results['distances'][0][i]
        metadata = results['metadatas'][0][i]
        text = results['documents'][0][i]

        count = seen_colleges.get(college, 0)
        if count < 2:
            chunks.append({
                'text': text,
                'metadata': metadata,
                'relevance_score': score
            })
            seen_colleges[college] = count + 1

        if len(chunks) >= n_results:
            break

    return chunks

def detect_filters(query_lower):
    from expander import COLLEGE_ALIASES, detect_category

    type_filter = None
    college_filter = None
    category_filter = None

    if any(w in query_lower for w in ['cet', 'mht cet', 'state quota', 'mh quota']):
        type_filter = 'MH'
    elif any(w in query_lower for w in ['jee', 'all india', 'ai quota', 'ai seats']):
        type_filter = 'AI'

    for alias, full_name in COLLEGE_ALIASES.items():
        if alias in query_lower:
            college_filter = full_name
            break

    category_filter = detect_category(query_lower)

    return type_filter, college_filter, category_filter

def retrieve_with_expansion(user_query, n_results=5):
    from expander import expand_query
    import re

    query_lower = user_query.lower()
    expanded = expand_query(user_query)

    type_filter, college_filter, category_filter = detect_filters(query_lower)

    print(f"Type: {type_filter}, College: {college_filter}, Category: {category_filter}")

    percentile_match = re.search(r'(\d{2,3}(?:\.\d+)?)\s*percentile', query_lower)
    user_percentile = float(percentile_match.group(1)) if percentile_match else None
    print(f"Percentile: {user_percentile}")

    conditions = []
    if type_filter:
        conditions.append({"type": {"$eq": type_filter}})
    if college_filter:
        conditions.append({"college_name": {"$eq": college_filter}})
    if category_filter:
        conditions.append({"category": {"$eq": category_filter}})
    if user_percentile:
        conditions.append({"percentile": {"$gte": user_percentile - 10}})
        conditions.append({"percentile": {"$lte": user_percentile + 10}})

    where = None
    if len(conditions) == 1:
        where = conditions[0]
    elif len(conditions) > 1:
        where = {"$and": conditions}

    if where:
        try:
            results = retrieve(expanded, n_results=n_results, where=where)
            if results:
                return results
        except Exception as e:
            print(f"Filtered search failed: {e}")
            non_percentile = [c for c in conditions if "percentile" not in str(c)]
            if non_percentile:
                where2 = non_percentile[0] if len(non_percentile) == 1 else {"$and": non_percentile}
                try:
                    return retrieve(expanded, n_results=n_results, where=where2)
                except:
                    pass

    return retrieve(expanded, n_results=n_results)