from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.services.gap_service import calculate_gaps, calculate_gap_statistics
from app.config import GAP_THRESHOLD_PERCENT

router = APIRouter()


@router.get("/{ticker}")
async def get_gap_history(
    ticker: str,
    min_gap: float = Query(default=GAP_THRESHOLD_PERCENT, description="Minimum gap percentage"),
    limit: int = Query(default=50, description="Maximum number of gaps to return")
):
    """Get gap history for a ticker."""
    ticker = ticker.upper()

    try:
        gaps = calculate_gaps(ticker, min_gap)
        return {
            "ticker": ticker,
            "gaps": gaps[:limit],
            "total": len(gaps)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticker}/stats")
async def get_gap_statistics(
    ticker: str,
    min_gap: float = Query(default=GAP_THRESHOLD_PERCENT, description="Minimum gap percentage")
):
    """Get gap statistics for a ticker."""
    ticker = ticker.upper()

    try:
        stats = calculate_gap_statistics(ticker, min_gap)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
