import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = SYSTEM_PROMPT = SYSTEM_PROMPT = """You are an expert admission counsellor for Maharashtra engineering colleges (MHT CET / DTE Maharashtra).

When a student asks about eligibility with their percentile, follow this exact logic:

SAFE options = colleges where the cutoff percentile is LOWER than student's percentile
(student's score is above cutoff = high chance of admission)

AMBITIOUS options = colleges where cutoff is slightly higher than student's percentile by 1-5 points
(student might miss in Round 1 but possible in Round 2/3)

OUT OF REACH = colleges where cutoff is more than 5 points above student's percentile

Present results in this order:
1. Safe options first (best colleges where student qualifies, sorted by cutoff descending)
2. Ambitious options second
3. Out of reach last (optional, only if relevant)

Rules:
1. Use ONLY the data provided in context. Never invent numbers.
2. Always mention year and CAP round for every cutoff.
3. Explain category codes simply — GOPENS means General Open State Level.
4. Never repeat the same college for the same category.
5. Give a clear final recommendation.
6. Keep it concise — students are stressed, don't overwhelm them.
"""

def generate_answer(user_query, retrieved_chunks):
    """
    Takes user query and retrieved chunks, generates a helpful answer.
    """
    # Build context from retrieved chunks
    context_parts = []
    for i, chunk in enumerate(retrieved_chunks):
        context_parts.append(f"[{i+1}] {chunk['text']}")
    
    context = "\n".join(context_parts)

    # Build the prompt
    prompt = f"""Here is the official cutoff data I found:

{context}

Student question: {user_query}

Please answer the student's question based on the data above.
Be specific with percentiles and college names.
If comparing multiple options, use a clear format."""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        max_tokens=500,
        temperature=0.3
    )

    return response.choices[0].message.content.strip()

if __name__ == "__main__":
    # Test with a sample query and fake chunks
    sample_chunks = [
        {
            'text': 'In 2025 CAP Round 1, COEP Technological University (COEP Technological University) offered Computer Science and Engineering CS CSE Computer Science with a closing percentile of 99.76 for the General Open (State Level) (GOPENS) category. The closing rank was 452. Location: Pune, Maharashtra. Year: 2025, Round: 1.',
            'metadata': {'college_name': 'COEP Technological University', 'year': '2025'}
        },
        {
            'text': 'In 2025 CAP Round 1, COEP Technological University (COEP Technological University) offered Computer Science and Engineering CS CSE Computer Science with a closing percentile of 97.23 for the General OBC (State Level) (GOBCS) category. The closing rank was 8821. Location: Pune, Maharashtra. Year: 2025, Round: 1.',
            'metadata': {'college_name': 'COEP Technological University', 'year': '2025'}
        }
    ]

    query = "What is COEP CS cutoff for general and OBC category in 2025?"
    print(f"Query: {query}")
    print()
    answer = generate_answer(query, sample_chunks)
    print(f"Answer:\n{answer}")