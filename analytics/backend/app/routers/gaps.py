from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import JSONResponse
from typing import Optional
from app.services.gap_service import calculate_gaps, calculate_gap_statistics
from app.config import GAP_THRESHOLD_PERCENT

router = APIRouter()

# In-memory cache for gap stats (ticker -> (data, timestamp))
_gap_stats_cache: dict = {}
_GAP_CACHE_TTL = 3600  # 1 hour


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
        response = JSONResponse(content={
            "ticker": ticker,
            "gaps": gaps[:limit],
            "total": len(gaps)
        })
        # Cache for 1 hour
        response.headers["Cache-Control"] = "public, max-age=3600"
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticker}/stats")
async def get_gap_statistics(
    ticker: str,
    min_gap: float = Query(default=GAP_THRESHOLD_PERCENT, description="Minimum gap percentage")
):
    """Get gap statistics for a ticker."""
    ticker = ticker.upper()
    cache_key = f"{ticker}_{min_gap}"

    try:
        # Check in-memory cache first
        import time
        if cache_key in _gap_stats_cache:
            cached_data, cached_time = _gap_stats_cache[cache_key]
            if time.time() - cached_time < _GAP_CACHE_TTL:
                response = JSONResponse(content=cached_data)
                response.headers["Cache-Control"] = "public, max-age=3600"
                response.headers["X-Cache"] = "HIT"
                return response

        # Calculate fresh data
        stats = calculate_gap_statistics(ticker, min_gap)

        # Store in cache
        _gap_stats_cache[cache_key] = (stats, time.time())

        response = JSONResponse(content=stats)
        response.headers["Cache-Control"] = "public, max-age=3600"
        response.headers["X-Cache"] = "MISS"
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
