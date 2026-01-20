"""
Cloudflare R2 Storage Service

Provides functions to read Parquet files from Cloudflare R2.
"""
import io
from typing import List, Optional
import boto3
from botocore.config import Config
import pandas as pd
import pyarrow.parquet as pq

from app.config import (
    R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET,
    R2_QUOTES_P95, R2_FUNDAMENTALS, R2_SHORT_DATA, R2_REFERENCE
)

# Initialize S3 client for R2
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


def list_objects(prefix: str) -> List[str]:
    """List all objects with given prefix in the bucket."""
    s3 = get_s3_client()
    objects = []

    paginator = s3.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=R2_BUCKET, Prefix=prefix):
        for obj in page.get('Contents', []):
            objects.append(obj['Key'])

    return objects


def read_parquet_from_r2(key: str) -> pd.DataFrame:
    """Read a Parquet file from R2 and return as DataFrame."""
    s3 = get_s3_client()

    try:
        response = s3.get_object(Bucket=R2_BUCKET, Key=key)
        data = response['Body'].read()

        # Read parquet from bytes
        buffer = io.BytesIO(data)
        table = pq.read_table(buffer)
        return table.to_pandas()
    except Exception as e:
        print(f"Error reading {key} from R2: {e}")
        return pd.DataFrame()


def get_available_tickers_r2() -> List[str]:
    """Get list of all available tickers from R2 quotes_p95 data."""
    tickers = set()

    # List all objects in quotes_p95 prefix
    objects = list_objects(R2_QUOTES_P95 + "/")

    for obj_key in objects:
        # Extract ticker from path like: quotes_p95/AAPL/year=2024/month=01/data.parquet
        parts = obj_key.split('/')
        if len(parts) >= 2 and parts[0] == R2_QUOTES_P95:
            ticker = parts[1]
            if ticker and not ticker.startswith('.'):
                tickers.add(ticker)

    return sorted(list(tickers))


def get_ticker_parquet_keys(ticker: str, prefix: str = R2_QUOTES_P95) -> List[str]:
    """Get all Parquet file keys for a ticker."""
    ticker_prefix = f"{prefix}/{ticker}/"
    objects = list_objects(ticker_prefix)
    return [k for k in objects if k.endswith('.parquet')]


def load_ticker_data_r2(ticker: str) -> pd.DataFrame:
    """Load all Parquet data for a ticker from R2."""
    keys = get_ticker_parquet_keys(ticker)

    if not keys:
        return pd.DataFrame()

    dfs = []
    for key in keys:
        df = read_parquet_from_r2(key)
        if not df.empty:
            dfs.append(df)

    if not dfs:
        return pd.DataFrame()

    result = pd.concat(dfs, ignore_index=True)

    # Sort by date if available
    if 'date' in result.columns:
        result = result.sort_values('date').reset_index(drop=True)

    return result
