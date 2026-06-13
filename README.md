# 🎓 MHT CET Admission Chatbot

A RAG-based (Retrieval-Augmented Generation) conversational AI chatbot that helps Maharashtra engineering students navigate the complex MHT CET admission process. Instead of manually searching through hundreds of pages of government PDFs, students simply chat with the bot and get instant, personalized college recommendations.

<!-- Add screenshot here -->
<!-- ![Demo Screenshot](screenshot.png) -->

## 🚀 Live Demo

<!-- Add deployed link here -->
<!-- [Live Demo](https://your-deployed-url.com) -->

---

## 🧠 What Makes This Different

Most admission chatbots use keyword matching or hardcoded rules. This system uses a full RAG pipeline:

- **255,000+ cutoff records** extracted from 28 official DTE Maharashtra PDFs (2022–2025)
- **Semantic search** via ChromaDB vector store — understands meaning, not just keywords
- **Smart query routing** — detects if a question needs cutoff data or general admission guidance
- **Category-aware filtering** — detects student's reservation category from natural language
- **Percentile-based categorization** — Python categorizes colleges into Safe / Ambitious / Out of Reach before the LLM responds (no math hallucinations)
- **Dynamic follow-up suggestions** — context-aware questions generated after every response

---

## 🏗️ Architecture

```
Student Query
     ↓
Query Expansion (Groq LLM) — expands abbreviations, resolves college nicknames
     ↓
Smart Router — cutoff query? → RAG pipeline | general query? → direct LLM
     ↓
Metadata Filters — type (MH/AI), category (GOPENS/OBC/SC...), percentile range
     ↓
ChromaDB Semantic Search — finds top-K relevant cutoff chunks
     ↓
Python Categorization — Safe / Ambitious / Out of Reach (no LLM math)
     ↓
Groq LLM (Llama 3.1) — generates natural language response
     ↓
React Frontend — displays answer with sources and follow-up suggestions
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React + Vite | Component model fits chat UI perfectly |
| Backend | Flask (Python) | Python-first AI ecosystem |
| LLM | Groq (Llama 3.1-8b-instant) | Fastest free API, open source model |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) | Local, free, no rate limits |
| Vector Store | ChromaDB | Zero infrastructure, local persistence |
| PDF Parsing | pdfplumber | Handles complex hierarchical DTE tables |
| Data | Official DTE Maharashtra PDFs | Primary source, 2022–2025 |

---

## 📊 Data Pipeline

```
28 Official PDFs (DTE Maharashtra)
     ↓
pdfplumber — extracts hierarchical tables
(college → branch → 20+ category columns)
     ↓
parse_mh.py / parse_ai.py — 255,258 structured records
     ↓
create_chunks.py — converts to natural language chunks
"In 2025 CAP Round 1, COEP offered Computer Engineering
with closing percentile 99.5 for GOPENS category..."
     ↓
ingest.py — embeds 19,192 filtered chunks into ChromaDB
(filtered to 2024-2025, Round 1, key categories)
```

**Data coverage:**
- 368 colleges
- 82 branches  
- 88 reservation categories
- 4 years (2022–2025)
- Both MH state quota and All India seats

---

## 📁 Project Structure

```
rag-admission-bot/
├── backend/
│   ├── core/
│   │   ├── retriever.py      # ChromaDB semantic search + metadata filtering
│   │   ├── generator.py      # Groq LLM response generation
│   │   └── expander.py       # Query expansion + alias resolution
│   ├── scripts/
│   │   ├── parse_mh.py       # MH state level PDF parser
│   │   ├── parse_ai.py       # All India seats PDF parser
│   │   ├── create_chunks.py  # Convert records to text chunks
│   │   └── ingest.py         # Embed chunks into ChromaDB
│   ├── data/
│   │   ├── raw/              # Original PDFs (not in repo)
│   │   └── processed/        # Generated CSVs (not in repo)
│   ├── app.py                # Flask API
│   ├── config.py             # Year/round config — update annually
│   └── .env                  # API keys (not in repo)
└── frontend/
    └── src/
        └── App.jsx           # React chat UI
```

---

## ⚙️ Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API key (free at console.groq.com)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install flask flask-cors groq chromadb sentence-transformers pdfplumber pandas python-dotenv langchain-text-splitters
```

Create `.env`:
```
GROQ_API_KEY=your_key_here
```

### Data Pipeline

Add your DTE Maharashtra PDFs to `backend/data/raw/` following this structure:
```
data/raw/
├── 2024/
│   ├── MH/   ← State level PDFs
│   └── AI/   ← All India seats PDFs
└── 2025/
    ├── MH/
    └── AI/
```

Then run:
```bash
python scripts/parse_mh.py
python scripts/parse_ai.py
python scripts/create_chunks.py
python scripts/ingest.py      # Takes 15-20 min on CPU
```

### Start Backend
```bash
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

---

## 🔄 Updating Data Each Year

1. Add new PDFs to `data/raw/YEAR/MH/` and `data/raw/YEAR/AI/`
2. Update `config.py`:
   ```python
   CURRENT_YEAR = 2026
   CAP_ROUNDS = {..., 2026: 3}
   INGEST_YEARS = [2025, 2026]
   ```
3. Run the data pipeline scripts again

No model retraining needed — just re-ingestion.

---

## 💡 Key Design Decisions

**Why RAG instead of fine-tuning?**
Cutoff data changes every year. RAG lets us update the knowledge base without retraining. Fine-tuning would require GPU infrastructure and thousands of labeled examples.

**Why local embeddings?**
sentence-transformers runs offline with no API costs or rate limits. After the initial 80MB download, embedding works without internet.

**Why Groq for generation?**
Fastest free LLM API available. Sub-second response times make the chat feel instant. Open source Llama 3.1 model means no vendor lock-in.

**Why Python categorizes Safe/Ambitious/Out of Reach?**
LLMs are unreliable at math comparisons. Python compares `cutoff <= student_percentile` with 100% accuracy. The LLM only handles language generation.

---

## 🎤 Interview Talking Points

- Built a data pipeline that automatically parses 28 official government PDFs with complex hierarchical table structures
- Designed the LLM layer as a pluggable component — switching between Groq, Ollama, or any provider requires changing one config value
- Separated math (Python) from language (LLM) to eliminate hallucination on percentile comparisons
- Knowledge base updates require zero model changes — just re-ingest new PDFs

---

## 📄 License

MIT

---

*Data sourced from official DTE Maharashtra and MHT CET Cell publications.*