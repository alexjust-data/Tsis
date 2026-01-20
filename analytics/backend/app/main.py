from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import gaps, tickers

app = FastAPI(
    title="TSIS Analytics API",
    description="API for serving stock analytics data from Parquet files",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://tsis.ai",
        "https://www.tsis.ai",
        "https://analytics.tsis.ai",
        "https://journal.tsis.ai",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(gaps.router, prefix="/api/gaps", tags=["gaps"])
app.include_router(tickers.router, prefix="/api/tickers", tags=["tickers"])


@app.get("/")
async def root():
    return {"message": "TSIS Analytics API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
