import os
from pathlib import Path

# Storage mode: "local" or "r2"
STORAGE_MODE = os.getenv("STORAGE_MODE", "r2")

# Cloudflare R2 Configuration (set via environment variables)
R2_ENDPOINT = os.getenv("R2_ENDPOINT", "")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY", "")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY", "")
R2_BUCKET = os.getenv("R2_BUCKET", "tsis-data")

# Local data directory (fallback)
DATA_DIR = Path(os.getenv("DATA_DIR", "C:/TSIS_Data/data"))

# Data paths (used for local mode)
QUOTES_2019_2025 = DATA_DIR / "quotes_p95_2019_2025"
QUOTES_2004_2018 = DATA_DIR / "quotes_p95_2004_2018"
OHLCV_INTRADAY = DATA_DIR / "ohlcv_intraday_1m"
FUNDAMENTALS_DIR = DATA_DIR / "fundamentals"
SHORT_DATA_DIR = DATA_DIR / "short_data"

# R2 paths (prefixes in bucket)
R2_QUOTES_P95 = "quotes_p95"
R2_FUNDAMENTALS = "fundamentals"
R2_SHORT_DATA = "short_data"
R2_REFERENCE = "reference"

# Gap threshold (minimum % to qualify as a gap)
GAP_THRESHOLD_PERCENT = 10.0
