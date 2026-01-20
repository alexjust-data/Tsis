"""
Parquet Service - Reads data from Cloudflare R2

Provides functions to load OHLCV and other market data from R2 storage.
"""
import io
from typing import Optional, List
import pandas as pd
import pyarrow.parquet as pq
import boto3
from botocore.config import Config

from app.config import (
    R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET,
    STORAGE_MODE, OHLCV_INTRADAY
)

# R2 paths
R2_OHLCV_PREFIX = "ohlcv_intraday_1m"

# S3 client singleton
_s3_client = None


def get_s3_client():
    """Get or create S3 client for R2."""
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            's3',
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_ACCESS_KEY,
            aws_secret_access_key=R2_SECRET_KEY,
            config=Config(signature_version='s3v4')
        )
    return _s3_client


def read_parquet_from_r2(key: str) -> pd.DataFrame:
    """Read a Parquet file from R2 and return as DataFrame."""
    s3 = get_s3_client()
    try:
        response = s3.get_object(Bucket=R2_BUCKET, Key=key)
        data = response['Body'].read()
        buffer = io.BytesIO(data)
        table = pq.read_table(buffer)
        return table.to_pandas()
    except Exception as e:
        print(f"Error reading {key} from R2: {e}")
        return pd.DataFrame()


def get_available_tickers() -> List[str]:
    """Get list of all available tickers from OHLCV data in R2."""
    s3 = get_s3_client()
    tickers = set()

    # Check both year ranges
    for year_range in ['2019_2025', '2004_2018']:
        prefix = f"{R2_OHLCV_PREFIX}/{year_range}/"

        try:
            # List objects with delimiter to get "folders" (tickers)
            paginator = s3.get_paginator('list_objects_v2')
            for page in paginator.paginate(Bucket=R2_BUCKET, Prefix=prefix, Delimiter='/'):
                for common_prefix in page.get('CommonPrefixes', []):
                    # Extract ticker from path like: ohlcv_intraday_1m/2019_2025/AAPL/
                    ticker = common_prefix['Prefix'].rstrip('/').split('/')[-1]
                    if ticker and not ticker.startswith('.'):
                        tickers.add(ticker)
        except Exception as e:
            print(f"Error listing tickers for {year_range}: {e}")

    return sorted(list(tickers))


def get_ticker_ohlcv_keys(ticker: str) -> List[str]:
    """Get all OHLCV parquet file keys for a ticker in R2."""
    s3 = get_s3_client()
    keys = []

    for year_range in ['2019_2025', '2004_2018']:
        prefix = f"{R2_OHLCV_PREFIX}/{year_range}/{ticker}/"

        try:
            paginator = s3.get_paginator('list_objects_v2')
            for page in paginator.paginate(Bucket=R2_BUCKET, Prefix=prefix):
                for obj in page.get('Contents', []):
                    if obj['Key'].endswith('.parquet'):
                        keys.append(obj['Key'])
        except Exception as e:
            print(f"Error listing files for {ticker}: {e}")

    return sorted(keys)


def load_ticker_daily_ohlcv(ticker: str, limit: Optional[int] = None) -> pd.DataFrame:
    """
    Load daily OHLCV data for a ticker by aggregating 1-minute data from R2.
    Returns daily open, high, low, close, volume.
    """
    keys = get_ticker_ohlcv_keys(ticker)

    if not keys:
        return pd.DataFrame()

    daily_data = []

    for key in keys:
        try:
            df = read_parquet_from_r2(key)

            if df.empty or 'date' not in df.columns:
                continue

            # Check required columns
            required = ['open', 'high', 'low', 'close', 'volume', 'date']
            if not all(col in df.columns for col in required):
                print(f"Missing columns in {key}: {df.columns.tolist()}")
                continue

            # Group by date and aggregate to daily
            for date_val, group in df.groupby('date'):
                daily = {
                    'date': pd.to_datetime(date_val),
                    'open': group['open'].iloc[0],
                    'high': group['high'].max(),
                    'low': group['low'].min(),
                    'close': group['close'].iloc[-1],
                    'volume': group['volume'].sum(),
                }
                daily_data.append(daily)

        except Exception as e:
            print(f"Error loading {key}: {e}")
            continue

    if not daily_data:
        return pd.DataFrame()

    result = pd.DataFrame(daily_data)
    result = result.drop_duplicates(subset=['date'])
    result = result.sort_values('date').reset_index(drop=True)

    if limit:
        result = result.tail(limit)

    return result


def load_ticker_quotes(ticker: str, limit: Optional[int] = None) -> pd.DataFrame:
    """Load quotes data for a ticker. Uses OHLCV data aggregated to daily."""
    return load_ticker_daily_ohlcv(ticker, limit)


def load_ohlcv_intraday(ticker: str, date: str) -> pd.DataFrame:
    """Load intraday 1-minute OHLCV data for a ticker on a specific date from R2."""
    year, month, day = date.split("-")
    year_int = int(year)

    year_range = '2019_2025' if year_int >= 2019 else '2004_2018'
    key = f"{R2_OHLCV_PREFIX}/{year_range}/{ticker}/year={year}/month={month}/minute.parquet"

    df = read_parquet_from_r2(key)

    if df.empty:
        return pd.DataFrame()

    # Filter for specific date
    if 'date' in df.columns:
        df = df[df['date'] == date]

    return df
