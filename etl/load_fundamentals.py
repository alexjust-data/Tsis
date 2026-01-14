import polars as pl
from pathlib import Path
from sqlalchemy import create_engine
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Use sync driver for ETL
DATABASE_URL = os.getenv("DATABASE_URL_SYNC", "postgresql://tsis:password@localhost:5432/tsis")
DATA_PATH = Path("C:/TSIS_Data")

def load_balance_sheets(engine):
    """Carga balance sheets"""
    path = DATA_PATH / "fundamentals" / "balance_sheets"
    if not path.exists():
        logger.warning(f"Path not found: {path}")
        return

    files = list(path.glob("*.parquet"))
    logger.info(f"Loading {len(files)} balance sheet files")

    for i, file in enumerate(files):
        try:
            df = pl.read_parquet(file)
            
            # Basic validation
            if df.is_empty(): continue

            # Extract first ticker from list if necessary or ensure format
            # The schema says 'tickers' is a list? let's check one file later if this fails.
            # Assuming schema from README: tickers (list)
            
            df = df.with_columns([
                pl.col("tickers").list.first().alias("ticker"),
                # Cast dates
                pl.col("period_end").cast(pl.Date, strict=False),
                pl.col("filing_date").cast(pl.Date, strict=False),
            ])

            # Select relevant columns that match our Company/Fundamental model, 
            # or just dump to raw table if we had one. 
            # For Phase 1, we mainly want the Company list.
            
            # Write to DB - specific tables would be better, but let's stick to the plan 
            # of populating the 'companies' table first.
            
            # We need to populate 'companies' table from this data first
            companies_df = df.select([
                pl.col("ticker"),
                pl.col("cik").cast(pl.Utf8),
                pl.lit("active").alias("status"), # Default
                pl.lit(True).alias("is_active")
            ]).unique(subset=["ticker"])
            
            # Upsert companies (simplified as append with constraints handling usually needs more work in pure pandas/polars 
            # but let's try to just insert ignore or similar. sqlalchemy doesn't do ON CONFLICT easily with pandas_to_sql
            # For now, let's just create a list of companies.
            
            # Actually, let's just insert into a temp table and do SQL merge if needed, 
            # OR just load companies.
             
        except Exception as e:
            logger.error(f"Error {file.stem}: {e}")

def create_companies_from_fundamentals(engine):
    """
    Simpler approach for Phase 1: 
    Iterate all fundamental files, collect unique tickers, insert into companies table.
    """
    logger.info("Collecting unique tickers from fundamentals...")
    path = DATA_PATH / "fundamentals" / "balance_sheets"
    if not path.exists():
        return

    tickers = set()
    files = list(path.glob("*.parquet"))
    
    # Just sample first 100 files for Phase 1 speed if many files, 
    # or all if we want completeness.
    for file in files:
        try:
            df = pl.read_parquet(file, columns=["tickers", "cik"])
            row = df.row(0)
            ticker_list = row[0] # column 0
            cik = row[1]
            if ticker_list:
                ticker = ticker_list[0]
                tickers.add((ticker, str(cik)))
        except Exception as e:
            pass
            
    logger.info(f"Found {len(tickers)} unique companies")
    
    # Bulk insert
    if not tickers:
        return

    # Convert to DF
    df_companies = pl.DataFrame(list(tickers), schema=["ticker", "cik"])
    df_companies = df_companies.with_columns([
        pl.lit("active").alias("status"),
        pl.lit(True).alias("is_active")
    ])
    
    # Write to DB
    # We use 'append' but this might fail on duplicates if run twice. 
    # Ideally use raw SQL for proper upsert.
    
    try:
        df_companies.write_database(
            table_name="companies",
            connection=engine,
            if_table_exists="append" 
        )
        logger.info("Companies inserted successfully")
    except Exception as e:
        logger.error(f"Insert failed (maybe duplicates): {e}")

def main():
    engine = create_engine(DATABASE_URL)
    logger.info("Starting ETL...")
    create_companies_from_fundamentals(engine)
    logger.info("ETL complete!")

if __name__ == "__main__":
    main()
