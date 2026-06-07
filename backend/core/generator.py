import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are an expert admission counsellor for Maharashtra engineering colleges.
You help students understand MHT CET cutoffs, CAP rounds, and college selection.

You have access to official DTE Maharashtra cutoff data from 2022-2025.

Rules you must follow:
1. Answer ONLY based on the context provided. Never make up cutoff numbers.
2. If the context doesn't have the answer, say so clearly.
3. Always mention the year and CAP round for any cutoff you quote.
4. Explain category codes in simple terms (e.g. GOPENS = General Open category).
5. Be helpful, clear, and encouraging to students.
6. When recommending colleges, mention cutoff percentile clearly.
7. If student asks about eligibility, compare their percentile with cutoffs in context.
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