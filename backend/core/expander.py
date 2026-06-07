import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Known college aliases — maps casual names to official names
COLLEGE_ALIASES = {
    'coep': 'COEP Technological University',
    'vjti': 'Veermata Jijabai Technological Institute',
    'pict': 'Pune Institute of Computer Technology',
    'mit': 'MIT College of Engineering',
    'coit': 'College of Information Technology',
    'walchand': 'Walchand College of Engineering',
    'spit': 'Sardar Patel Institute of Technology',
    'kkw': 'KKW College of Engineering',
    'dyp': 'Dr. D.Y. Patil Institute of Technology',
}

# Category aliases — maps casual terms to official codes
CATEGORY_ALIASES = {
    'general': 'GOPENS General Open State Level',
    'open': 'GOPENS General Open State Level',
    'obc': 'GOBCS General OBC State Level',
    'sc': 'GSCS General SC State Level',
    'st': 'GSTS General ST State Level',
    'ews': 'EWS Economically Weaker Section',
    'tfws': 'TFWS Tuition Fee Waiver Scheme',
    'sebc': 'GSEBCS General SEBC State Level',
    'ladies': 'LOPENS Ladies Open State Level',
    'girls': 'LOPENS Ladies Open State Level',
    'defence': 'DEFOPENS Defence Open State Level',
    'pwd': 'PWDOPENS PWD Open State Level',
    'nt1': 'GNT1S General NT1 State Level',
    'nt2': 'GNT2S General NT2 State Level',
    'nt3': 'GNT3S General NT3 State Level',
    'vj': 'GVJS General VJ DT State Level',
}

def expand_query(user_query):
    """
    Takes a casual student query and expands it to match
    the language used in our ChromaDB chunks.
    Uses both rule-based aliases and Groq LLM expansion.
    """
    query_lower = user_query.lower()
    
    # Step 1 — Rule based expansion for known aliases
    expansions = [user_query]
    
    for alias, full_name in COLLEGE_ALIASES.items():
        if alias in query_lower:
            expansions.append(full_name)
    
    for alias, full_name in CATEGORY_ALIASES.items():
        if alias in query_lower:
            expansions.append(full_name)
    
    # Step 2 — LLM based expansion using Groq
    expansion_prompt = f"""You are helping search a Maharashtra engineering admission database.
    
The database contains cutoff data with these fields:
- College names (e.g. "COEP Technological University", "Pune Institute of Computer Technology")
- Branch names (e.g. "Computer Science and Engineering", "Information Technology")  
- Categories (e.g. GOPENS=General Open, GOBCS=General OBC, GSCS=General SC, TFWS=Tuition Fee Waiver, EWS=Economically Weaker Section)
- Years (2022-2025) and CAP Rounds (1-4)

Student query: "{user_query}"

Rewrite this query using the exact terminology from the database.
Expand abbreviations, resolve college nicknames, map category names to codes.
Return ONLY the expanded search query as a single line. No explanations, no bullet points, no breakdown. Just the query text."""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": expansion_prompt}],
        max_tokens=150,
        temperature=0.1
    )
    
    llm_expansion = response.choices[0].message.content.strip()
    expansions.append(llm_expansion)
    
    # Combine all expansions into one rich query
    final_query = ' '.join(expansions)
    return final_query

if __name__ == "__main__":
    # Test the expander
    test_queries = [
        "COEP CS cutoff general 2025",
        "vjti mechanical obc cutoff",
        "which colleges can i get with 85 percentile sc category",
    ]
    
    for query in test_queries:
        print(f"Original: {query}")
        expanded = expand_query(query)
        print(f"Expanded: {expanded}")
        print()