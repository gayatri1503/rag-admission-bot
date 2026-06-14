import os
import sys
import re
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from groq import Groq
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta

load_dotenv()

sys.path.append(os.path.join(os.path.dirname(__file__), 'core'))

from retriever import retrieve_with_expansion
from generator import generate_answer

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

# Config
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///admissions.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'mhtcet-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

# Init extensions
from models import db, User, Chat, Message
db.init_app(app)
jwt = JWTManager(app)

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

def process_chat_message(user_message):
    """Core RAG pipeline — returns answer, sources, suggestions"""
    # Reject gibberish — must have at least 3 real words or a meaningful query
    words = [w for w in user_message.split() if len(w) > 1]
    if len(words) < 2 or len(user_message) < 8:
        return (
            "I didn't quite understand that. Could you please ask a specific question about Maharashtra engineering admissions? For example: 'Which colleges can I get with 85 percentile in OBC category?'",
            [],
            [
                "Colleges for 85 percentile general category?",
                "VJTI cutoff for OBC 2025?",
                "What documents do I need for CAP Round 1?",
                "Explain freeze, float and slide options",
            ]
        )
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
                context_parts.append("=== SAFE OPTIONS (cutoff BELOW student percentile) ===")
                for c in safe[:5]:
                    m = c['metadata']
                    context_parts.append(
                        f"SAFE | {m['college_name']} | {m['branch_name']} | "
                        f"{m['category']} | Cutoff: {float(m['percentile']):.2f}% | "
                        f"{m['year']} Round {m['round']}"
                    )
            if ambitious:
                context_parts.append("=== AMBITIOUS OPTIONS (cutoff 1-5 points above) ===")
                for c in ambitious[:3]:
                    m = c['metadata']
                    context_parts.append(
                        f"AMBITIOUS | {m['college_name']} | {m['branch_name']} | "
                        f"{m['category']} | Cutoff: {float(m['percentile']):.2f}% | "
                        f"{m['year']} Round {m['round']}"
                    )
            if out_of_reach:
                context_parts.append("=== OUT OF REACH ===")
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

I have already done the math correctly. Here is the pre-categorized data:

{structured_context}

IMPORTANT RULES:
- Copy the categorization EXACTLY as given above. SAFE means SAFE, AMBITIOUS means AMBITIOUS.
- Do NOT move any college from one category to another.
- Do NOT recalculate anything.
- Show the exact cutoff percentile for every college.
- Present in this order: Safe options first, then Ambitious, then Out of Reach.
- End with a recommendation."""

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
    return answer, sources, suggestions

# ─── Auth Routes ────────────────────────────────────────────

@app.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not name or not email or not password:
            return jsonify({'error': 'Name, email and password are required'}), 400

        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400

        user = User(
            name=name,
            email=email,
            password_hash=generate_password_hash(password)
        )
        db.session.add(user)
        db.session.commit()

        token = create_access_token(identity=str(user.id))
        return jsonify({
            'token': token,
            'user': user.to_dict()
        }), 201

    except Exception as e:
        print(f"Register error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        user = User.query.filter_by(email=email).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Invalid email or password'}), 401

        token = create_access_token(identity=str(user.id))
        return jsonify({
            'token': token,
            'user': user.to_dict()
        })

    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/auth/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()})

# ─── Chat History Routes ─────────────────────────────────────

@app.route('/chats', methods=['GET'])
@jwt_required()
def get_chats():
    user_id = get_jwt_identity()
    chats = Chat.query.filter_by(user_id=int(user_id)).order_by(Chat.updated_at.desc()).all()
    return jsonify({'chats': [c.to_dict() for c in chats]})

@app.route('/chats', methods=['POST'])
@jwt_required()
def create_chat():
    user_id = get_jwt_identity()
    chat = Chat(user_id=int(user_id), title='New conversation')
    db.session.add(chat)
    db.session.commit()
    return jsonify({'chat': chat.to_dict()}), 201

@app.route('/chats/<int:chat_id>', methods=['DELETE'])
@jwt_required()
def delete_chat(chat_id):
    user_id = get_jwt_identity()
    chat = Chat.query.filter_by(id=chat_id, user_id=int(user_id)).first()
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404
    db.session.delete(chat)
    db.session.commit()
    return jsonify({'message': 'Chat deleted'})

@app.route('/chats/<int:chat_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(chat_id):
    user_id = get_jwt_identity()
    chat = Chat.query.filter_by(id=chat_id, user_id=int(user_id)).first()
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404
    messages = Message.query.filter_by(chat_id=chat_id).order_by(Message.created_at).all()
    return jsonify({'messages': [m.to_dict() for m in messages]})

# ─── Main Chat Route ─────────────────────────────────────────

@app.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400

        user_message = data['message'].strip()
        chat_id = data.get('chat_id')

        if not user_message:
            return jsonify({'error': 'Empty message'}), 400

        # Get or create chat
        if chat_id:
            chat_obj = Chat.query.filter_by(id=chat_id, user_id=int(user_id)).first()
            if not chat_obj:
                return jsonify({'error': 'Chat not found'}), 404
        else:
            chat_obj = Chat(user_id=int(user_id), title='New conversation')
            db.session.add(chat_obj)
            db.session.flush()

        # Save user message
        user_msg = Message(
            chat_id=chat_obj.id,
            role='user',
            content=user_message,
            sources='[]',
            suggestions='[]'
        )
        db.session.add(user_msg)

        # Process through RAG pipeline
        answer, sources, suggestions = process_chat_message(user_message)

        # Save bot message
        bot_msg = Message(
            chat_id=chat_obj.id,
            role='bot',
            content=answer,
            sources=json.dumps(sources),
            suggestions=json.dumps(suggestions)
        )
        db.session.add(bot_msg)

        # Update chat title from first user message
        if chat_obj.title == 'New conversation':
            chat_obj.title = user_message[:50] + ('…' if len(user_message) > 50 else '')

        from datetime import datetime
        chat_obj.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'answer': answer,
            'sources': sources,
            'suggestions': suggestions,
            'chat_id': chat_obj.id,
            'chat_title': chat_obj.title
        })

    except Exception as e:
        print(f"Chat error: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

# ─── Init DB ─────────────────────────────────────────────────

with app.app_context():
    db.create_all()
    print("Database initialized.")

if __name__ == '__main__':
    app.run(debug=True, port=5000)