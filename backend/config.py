# ============================================
# ADMISSION CONFIG — Update this every year
# ============================================

# Current admission year
CURRENT_YEAR = 2025

# CAP rounds per year — update when DTE announces
CAP_ROUNDS = {
    2022: 3,
    2023: 3,
    2024: 3,
    2025: 4,  # 2025 had 4 rounds
}

# Years available in our knowledge base
AVAILABLE_YEARS = [2022, 2023, 2024, 2025]

# Categories with human readable names
CATEGORY_NAMES = {
    'GOPENS': 'General Open (State Level)',
    'GSCS': 'SC (State Level)',
    'GSTS': 'ST (State Level)',
    'GOBCS': 'OBC (State Level)',
    'GSEBCS': 'SEBC (State Level)',
    'LOPENS': 'Ladies Open (State Level)',
    'TFWS': 'Tuition Fee Waiver Scheme',
    'EWS': 'Economically Weaker Section',
    'GNT1S': 'NT1 (State Level)',
    'GNT2S': 'NT2 (State Level)',
    'GNT3S': 'NT3 (State Level)',
    'GVJS': 'VJ/DT (State Level)',
}

# Data ingestion settings
INGEST_YEARS = [2024, 2025]      # Years to embed
INGEST_ROUNDS = [1]              # Rounds to embed
INGEST_CATEGORIES = [            # Categories to embed
    'GOPENS', 'GSCS', 'GSTS', 'GOBCS', 'GSEBCS',
    'LOPENS', 'TFWS', 'EWS', 'GNT1S', 'GNT2S',
    'GNT3S', 'GVJS', 'LOBCS', 'AI'
]