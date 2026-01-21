from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Optional
import json
from app.services.parquet_service import get_available_tickers, load_ticker_quotes, load_ohlcv_intraday, list_ticker_intraday_files

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


@router.get("/{ticker}/intraday-files")
async def list_ticker_intraday(ticker: str):
    """List available intraday data files for a ticker (debug endpoint)."""
    ticker = ticker.upper()
    try:
        files = list_ticker_intraday_files(ticker)
        return {
            "ticker": ticker,
            "files": files,
            "count": len(files)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticker}/intraday/{date}")
async def get_ticker_intraday(
    ticker: str,
    date: str,
):
    """Get intraday 1-minute OHLCV data for a ticker on a specific date."""
    ticker = ticker.upper()

    try:
        df = load_ohlcv_intraday(ticker, date)

        if df.empty:
            raise HTTPException(status_code=404, detail=f"No intraday data found for {ticker} on {date}")

        # Convert DataFrame to JSON-serializable format
        df_copy = df.copy()

        print(f"DEBUG: Columns for {ticker} on {date}: {df_copy.columns.tolist()}")

        # Handle different possible time column names
        time_col = None
        for col in ['time', 'timestamp', 'datetime', 'minute']:
            if col in df_copy.columns:
                time_col = col
                break

        if time_col:
            # Convert to time string (HH:MM:SS format)
            time_values = df_copy[time_col]

            # Check first value to determine format
            first_val = time_values.iloc[0]

            if hasattr(first_val, 'strftime'):
                # It's a datetime object
                df_copy['time'] = time_values.apply(lambda x: x.strftime('%H:%M:%S'))
            elif isinstance(first_val, str):
                # It's a string - might be "2019-11-08 14:33" or just "14:33"
                if ' ' in str(first_val):
                    # Full datetime string - extract time part
                    df_copy['time'] = time_values.apply(lambda x: str(x).split(' ')[-1] if ' ' in str(x) else str(x))
                else:
                    df_copy['time'] = time_values.astype(str)
            else:
                df_copy['time'] = time_values.astype(str)

        # Ensure we have the required columns
        required_cols = ['time', 'open', 'high', 'low', 'close', 'volume']
        available_cols = [c for c in required_cols if c in df_copy.columns]

        if not available_cols:
            raise HTTPException(status_code=500, detail=f"No valid columns found. Available: {df_copy.columns.tolist()}")

        candles = df_copy[available_cols].to_dict(orient='records')

        result = {
            "ticker": ticker,
            "date": date,
            "candles": candles,
            "count": len(candles),
            "columns": df_copy.columns.tolist()
        }
        return JSONResponse(content=result)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"ERROR loading intraday: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
