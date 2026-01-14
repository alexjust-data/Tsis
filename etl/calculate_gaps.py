import polars as pl
from pathlib import Path
from sqlalchemy import create_engine
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL_SYNC", "postgresql://tsis:password@localhost:5432/tsis")
DATA_PATH = Path("C:/TSIS_Data")
GAP_THRESHOLD = 10

def calculate_gaps_for_ticker(ticker: str, ohlcv: pl.DataFrame) -> pl.DataFrame:
    # Sort
    ohlcv = ohlcv.sort("timestamp") # Assuming 'timestamp' column based on README schemas (which said timestamp) 
    # Actually README 2.2 schema for OHLCV wasn't explicitly shown field by field for OHLCV, 
    # but usually it's open, high, low, close, volume, timestamp.
    # Let's assume standard names.
    
    # We need to aggregate to DAILY to find gaps between Days.
    # OHLCV is 1-minute.
    
    # 1. Resample to Daily
    daily = ohlcv.group_by_dynamic("timestamp", every="1d").agg([
        pl.col("open").first().alias("open"),
        pl.col("high").max().alias("high"),
        pl.col("low").min().alias("low"),
        pl.col("close").last().alias("close"),
        pl.col("volume").sum().alias("volume"),
    ]).with_columns(
        pl.col("timestamp").alias("date")
    ).sort("date")
    
    # 2. Calculate Gap
    # Gap = (Today Open - Prev Close) / Prev Close
    daily = daily.with_columns([
        pl.col("close").shift(1).alias("prev_close"),
    ])
    
    daily = daily.with_columns([
        ((pl.col("open") - pl.col("prev_close")) / pl.col("prev_close") * 100).alias("gap_value")
    ])
    
    # Filter
    gaps = daily.filter(pl.col("gap_value").abs() >= GAP_THRESHOLD)
    
    if gaps.is_empty():
        return gaps
        
    # Add metadata
    gaps = gaps.with_columns([
        pl.lit(ticker).alias("ticker"),
        pl.when(pl.col("gap_value") > 0).then(pl.lit("up")).otherwise(pl.lit("down")).alias("gap_direction"),
        # Spikes
        ((pl.col("high") - pl.col("open")) / pl.col("open") * 100).alias("high_spike"),
        ((pl.col("low") - pl.col("open")) / pl.col("open") * 100).alias("low_spike"),
        ((pl.col("close") - pl.col("open")) / pl.col("open") * 100).alias("return_pct"),
        ((pl.col("high") - pl.col("low")) / pl.col("low") * 100).alias("range_pct"),
    ])
    
    # Select columns matching Gap model
    # Note: Model has pm_volume, etc. We fill null for now
    
    return gaps.select([
        "date", "ticker", "gap_value", "gap_direction", 
        "open", "high", "low", "close", "prev_close", "volume",
        "high_spike", "low_spike", "return_pct", "range_pct"
    ])

def main():
    engine = create_engine(DATABASE_URL)
    ohlcv_path = DATA_PATH / "ohlcv_intraday_1m"
    
    # Just process a few tickers for Phase 1
    # Scanning entire directory might take long
    
    count = 0
    # Walk through year folders
    for year_dir in ohlcv_path.glob("*"): 
        if not year_dir.is_dir(): continue
        
        # Inside year_dir are ticker folders? checking structure...
        # README says: ohlcv_intraday_1m/2004_2018/ and 2019_2025/
        # Then inside... assume parquet files partitioned by ticker?
        # Actually README 2.1 says "Multi-ticker | Parquet particionado"
        # Often this means: dataset/ticker=AAPL/file.parquet OR dataset/partition.parquet with ticker column.
        # Let's assume folder per ticker based on my previous list_dir:
        # "ohlcv_intraday_1m", "numChildren":592354 suggests MANY files or folders.
        # Likely ticker=XYZ folders.
        
        # Let's try to find a few ticker folders
        for ticker_dir in year_dir.iterdir():
            if not ticker_dir.is_dir(): continue
            
            ticker = ticker_dir.name.split('=')[-1] if '=' in ticker_dir.name else ticker_dir.name
            
            try:
                df = pl.read_parquet(ticker_dir / "*.parquet")
                gaps = calculate_gaps_for_ticker(ticker, df)
                
                if not gaps.is_empty():
                    # Write
                    gaps.write_database(
                        table_name="gaps",
                        connection=engine,
                        if_table_exists="append"
                    )
                    logger.info(f"Loaded {len(gaps)} gaps for {ticker}")
            except Exception as e:
                logger.error(f"Failed {ticker}: {e}")
            
            count += 1
            if count >= 10: break # Only 10 tickers for Phase 1 test
        
        if count >= 10: break

if __name__ == "__main__":
    main()
