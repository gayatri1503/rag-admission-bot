import os
import sys
import re
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

sys.path.append(os.path.join(os.path.dirname(__file__), 'core'))

from retriever import retrieve_with_expansion
from generator import generate_answer

app = Flask(__name__)
CORS(app)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are an expert admission counsellor for Maharashtra engineering colleges (MHT CET / DTE Maharashtra).

When presenting college options to a student:
- Present SAFE options first (colleges where student clearly qualifies)
- Then AMBITIOUS options (slight reach)
- Keep it encouraging and clear
- Never recalculate the categorization — it is already done correctly for you
- Give a clear final recommendation
- Keep answers concise and easy to read
"""

NON_CUTOFF_KEYWORDS = [
    'document', 'certificate', 'checklist', 'required',
    'freeze', 'float', 'slide', 'what is', 'explain',
    'tfws', 'cap round process', 'how does', 'difference between',
    'ai seats', 'mh seats', 'deadline', 'schedule', 'fees',
    'procedure', 'process', 'steps', 'eligibility criteria',
]

DOCUMENT_KNOWLEDGE = """
You are an expert on Maharashtra engineering admissions (MHT CET / DTE Maharashtra).

Documents required for CAP Round 1:
- HSC (12th) Marksheet and Passing Certificate
- SSC (10th) Marksheet
- MHT CET 2025 Scorecard
- Domicile Certificate (Maharashtra)
- Nationality Certificate / Indian Citizenship proof
- Caste Certificate (for reserved category - SC/ST/OBC/VJ/NT/SEBC)
- Non-Creamy Layer Certificate (for OBC/VJ/NT/SEBC - must be within 1 year)
- EWS Certificate (if applicable - issued by Tehsildar)
- TFWS proof (if applying under Tuition Fee Waiver Scheme)
- Aadhar Card (mandatory)
- Passport size photographs (6-8 copies)
- Gap Certificate (if applicable)
- Migration Certificate (if from outside Maharashtra board)
- JEE Main Scorecard (for AI seats only)

CAP Round Process:
- Round 1: Initial allotment. Options: Freeze (accept and stop), Float (accept but try for better), Slide (accept but try within same institute).
- Round 2: Based on remaining seats after Round 1 confirmations
- Round 3/4: Final rounds for remaining seats

TFWS (Tuition Fee Waiver Scheme):
- Full tuition fee waiver for students whose family income is below 8 lakhs per annum
- Merit based - separate cutoff (usually higher than GOPENS)
- Family income certificate required

AI vs MH Seats:
- AI (All India) seats: For students with JEE Main scores, open to all India candidates
- MH seats: For Maharashtra domicile students with MHT CET scores
- Different cutoffs apply for each type
"""

def is_non_cutoff_query(message):
    msg_lower = message.lower()
    for keyword in NON_CUTOFF_KEYWORDS:
        if keyword in msg_lower:
            return True
    return False

def generate_followup_suggestions(user_query, answer):
    prompt = f"""Based on this conversation about Maharashtra engineering admissions:
User asked: "{user_query}"

Generate exactly 4 short follow-up questions a student might ask next.
Make them specific and relevant to what was just discussed.
Return ONLY a JSON array of 4 strings. No other text.
Example: ["Question 1?", "Question 2?", "Question 3?", "Question 4?"]"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.7
        )
        text = response.choices[0].message.content.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        suggestions = json.loads(text)
        if isinstance(suggestions, list) and len(suggestions) >= 4:
            return suggestions[:4]
    except Exception as e:
        print(f"Suggestion generation failed: {e}")

    return [
        "What documents do I need for CAP Round 1?",
        "Explain freeze, float and slide options",
        "What is TFWS category?",
        "Difference between AI and MH seats?",
    ]

def categorize_chunks(chunks, user_percentile):
    """
    Categorize retrieved chunks based on percentile comparison.
    Python does the math — not the LLM.
    safe      = cutoff <= student percentile (student qualifies)
    ambitious = cutoff is 1-5 points above student percentile
    out_of_reach = cutoff more than 5 points above
    """
    safe = []
    ambitious = []
    out_of_reach = []
    seen = set()

    for chunk in chunks:
        percentile = float(chunk['metadata'].get('percentile', 0))
        college = chunk['metadata'].get('college_name', '')
        category = chunk['metadata'].get('category', '')
        key = f"{college}_{category}"

        if key in seen:
            continue
        seen.add(key)

        if percentile <= user_percentile:
            safe.append(chunk)
        elif percentile <= user_percentile + 5:
            ambitious.append(chunk)
        else:
            out_of_reach.append(chunk)

    safe.sort(key=lambda x: float(x['metadata'].get('percentile', 0)), reverse=True)
    ambitious.sort(key=lambda x: float(x['metadata'].get('percentile', 0)))

    return safe, ambitious, out_of_reach

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400

        user_message = data['message'].strip()
        if not user_message:
            return jsonify({'error': 'Empty message'}), 400

        if is_non_cutoff_query(user_message):
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": DOCUMENT_KNOWLEDGE},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=600,
                temperature=0.3
            )
            answer = response.choices[0].message.content.strip()
            sources = []

        else:
            percentile_match = re.search(
                r'(\d{2,3}(?:\.\d+)?)\s*percentile',
                user_message.lower()
            )
            user_percentile = float(percentile_match.group(1)) if percentile_match else None

            chunks = retrieve_with_expansion(user_message, n_results=20)

            if user_percentile:
                safe, ambitious, out_of_reach = categorize_chunks(chunks, user_percentile)

                context_parts = []

                if safe:
                    context_parts.append("=== SAFE OPTIONS (cutoff BELOW student percentile — student qualifies) ===")
                    for c in safe[:5]:
                        m = c['metadata']
                        context_parts.append(
                            f"SAFE | {m['college_name']} | {m['branch_name']} | "
                            f"{m['category']} | Cutoff: {float(m['percentile']):.2f}% | "
                            f"{m['year']} Round {m['round']}"
                        )

                if ambitious:
                    context_parts.append("=== AMBITIOUS OPTIONS (cutoff 1-5 points above student percentile) ===")
                    for c in ambitious[:3]:
                        m = c['metadata']
                        context_parts.append(
                            f"AMBITIOUS | {m['college_name']} | {m['branch_name']} | "
                            f"{m['category']} | Cutoff: {float(m['percentile']):.2f}% | "
                            f"{m['year']} Round {m['round']}"
                        )

                if out_of_reach:
                    context_parts.append("=== OUT OF REACH (cutoff more than 5 points above) ===")
                    for c in out_of_reach[:2]:
                        m = c['metadata']
                        context_parts.append(
                            f"OUT OF REACH | {m['college_name']} | {m['branch_name']} | "
                            f"{m['category']} | Cutoff: {float(m['percentile']):.2f}% | "
                            f"{m['year']} Round {m['round']}"
                        )

                structured_context = "\n".join(context_parts)

                prompt = f"""Student's MHT CET percentile: {user_percentile}
                Student's question: {user_message}

                Pre-categorized college data (already mathematically correct — do NOT change):

                {structured_context}

                Present this to the student clearly. For EVERY college mention:
                - College name
                - Branch name  
                - Cutoff percentile (exact number)
                - Year and round
                Do NOT recalculate or change any categorization.
                End with a clear recommendation."""

                response = client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=600,
                    temperature=0.2
                )
                answer = response.choices[0].message.content.strip()
                all_chunks = safe + ambitious + out_of_reach

            else:
                answer = generate_answer(user_message, chunks)
                all_chunks = chunks

            sources = [{
                'college': c['metadata'].get('college_name', ''),
                'branch': c['metadata'].get('branch_name', ''),
                'year': c['metadata'].get('year', ''),
                'category': c['metadata'].get('category', ''),
                'percentile': c['metadata'].get('percentile', ''),
                'relevance': round(c['relevance_score'], 3)
            } for c in all_chunks[:5]]

        suggestions = generate_followup_suggestions(user_message, answer)

        return jsonify({
            'answer': answer,
            'sources': sources,
            'suggestions': suggestions
        })

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)