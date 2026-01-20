from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Optional
import json
from app.services.parquet_service import get_available_tickers, load_ticker_quotes

router = APIRouter()


@router.get("/")
async def list_tickers(
    search: Optional[str] = Query(default=None, description="Search term for ticker symbol"),
    limit: int = Query(default=100, description="Maximum number of tickers to return")
):
    """List all available tickers."""
    tickers = get_available_tickers()

    if search:
        search = search.upper()
        tickers = [t for t in tickers if search in t]

    return {
        "tickers": tickers[:limit],
        "total": len(tickers)
    }


@router.get("/{ticker}")
async def get_ticker_info(ticker: str):
    """Get basic info for a ticker."""
    ticker = ticker.upper()

    try:
        df = load_ticker_quotes(ticker, limit=1)

        if df.empty:
            raise HTTPException(status_code=404, detail=f"Ticker {ticker} not found")

        # Get latest data
        latest = df.iloc[-1]

        return {
            "ticker": ticker,
            "latest_date": latest.get('date', None),
            "has_data": True,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticker}/quotes")
async def get_ticker_quotes(
    ticker: str,
    limit: int = Query(default=100, description="Maximum number of quotes to return")
):
    """Get historical quotes for a ticker."""
    ticker = ticker.upper()

    try:
        df = load_ticker_quotes(ticker, limit=limit)

        if df.empty:
            raise HTTPException(status_code=404, detail=f"No quotes found for {ticker}")

        # Convert DataFrame to JSON-serializable format
        # Use pandas json_normalize to handle this properly
        df_copy = df.copy()
        df_copy['date'] = df_copy['date'].dt.strftime('%Y-%m-%d')
        quotes = df_copy.to_dict(orient='records')

        result = {
            "ticker": ticker,
            "quotes": quotes,
            "count": len(quotes)
        }
        return JSONResponse(content=result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
