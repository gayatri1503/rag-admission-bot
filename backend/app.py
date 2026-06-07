import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

# Add core folder to path so we can import from it
sys.path.append(os.path.join(os.path.dirname(__file__), 'core'))

from retriever import retrieve_with_expansion
from generator import generate_answer

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'RAG Admission Bot is running'})

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400
        
        user_message = data['message'].strip()
        
        if not user_message:
            return jsonify({'error': 'Empty message'}), 400

        # Step 1 — Retrieve relevant chunks
        chunks = retrieve_with_expansion(user_message, n_results=5)
        
        # Step 2 — Generate answer using retrieved chunks
        answer = generate_answer(user_message, chunks)
        
        # Step 3 — Return answer with sources
        sources = []
        for chunk in chunks:
            sources.append({
                'college': chunk['metadata'].get('college_name', ''),
                'branch': chunk['metadata'].get('branch_name', ''),
                'year': chunk['metadata'].get('year', ''),
                'category': chunk['metadata'].get('category', ''),
                'percentile': chunk['metadata'].get('percentile', ''),
                'relevance': round(chunk['relevance_score'], 3)
            })
        
        return jsonify({
            'answer': answer,
            'sources': sources
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)