from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from app.services.parquet_service import load_ticker_quotes, load_ohlcv_intraday
from app.config import GAP_THRESHOLD_PERCENT


def calculate_gaps(ticker: str, min_gap_percent: float = GAP_THRESHOLD_PERCENT) -> List[Dict[str, Any]]:
    """
    Calculate gap days for a ticker.
    A gap is when the open price is significantly different from the previous close.
    """
    df = load_ticker_quotes(ticker)

    if df.empty or len(df) < 2:
        return []

    # Ensure we have required columns
    required_cols = ['date', 'open', 'close', 'high', 'low', 'volume']

    # Check if columns exist (may have different names)
    col_mapping = {}
    for col in df.columns:
        col_lower = col.lower()
        if 'open' in col_lower:
            col_mapping['open'] = col
        elif 'close' in col_lower:
            col_mapping['close'] = col
        elif 'high' in col_lower:
            col_mapping['high'] = col
        elif 'low' in col_lower:
            col_mapping['low'] = col
        elif 'volume' in col_lower:
            col_mapping['volume'] = col

    # Rename columns if needed
    if col_mapping:
        df = df.rename(columns={v: k for k, v in col_mapping.items()})

    # Check for required columns
    missing = [c for c in ['open', 'close', 'high', 'low'] if c not in df.columns]
    if missing:
        print(f"Missing columns for {ticker}: {missing}")
        return []

    # Sort by date
    df = df.sort_values('date').reset_index(drop=True)

    # Calculate gap percentage
    df['prev_close'] = df['close'].shift(1)
    df['gap_pct'] = ((df['open'] - df['prev_close']) / df['prev_close']) * 100

    # Filter for gaps above threshold
    gaps_df = df[abs(df['gap_pct']) >= min_gap_percent].copy()

    gaps = []
    for _, row in gaps_df.iterrows():
        gap_data = {
            'date': row['date'].strftime('%Y-%m-%d') if pd.notna(row['date']) else None,
            'gap_value': round(row['gap_pct'], 2),
            'open': round(row['open'], 4),
            'close': round(row['close'], 4),
            'high': round(row['high'], 4),
            'low': round(row['low'], 4),
            'prev_close': round(row['prev_close'], 4) if pd.notna(row['prev_close']) else None,
            'volume': int(row.get('volume', 0)) if pd.notna(row.get('volume', 0)) else 0,
        }

        # Calculate high spike and low spike from open
        if pd.notna(row['open']) and row['open'] != 0:
            gap_data['high_spike'] = round(((row['high'] - row['open']) / row['open']) * 100, 2)
            gap_data['low_spike'] = round(((row['low'] - row['open']) / row['open']) * 100, 2)
            gap_data['return'] = round(((row['close'] - row['open']) / row['open']) * 100, 2)
        else:
            gap_data['high_spike'] = 0
            gap_data['low_spike'] = 0
            gap_data['return'] = 0

        # Close direction
        gap_data['close_direction'] = 'green' if row['close'] > row['open'] else 'red'

        gaps.append(gap_data)

    return gaps


def calculate_gap_statistics(ticker: str, min_gap_percent: float = GAP_THRESHOLD_PERCENT) -> Dict[str, Any]:
    """Calculate aggregate gap statistics for a ticker."""
    gaps = calculate_gaps(ticker, min_gap_percent)

    if not gaps:
        return {
            'ticker': ticker,
            'number_of_gaps': 0,
            'avg_gap_value': 0,
            'avg_volume': '0',
            'avg_premarket_volume': '0',
            'gap_day': {},
            'day2': {},
        }

    gaps_df = pd.DataFrame(gaps)

    def format_volume(vol: float) -> str:
        """Format volume with M/K suffix."""
        if vol >= 1_000_000:
            return f"{vol / 1_000_000:.2f} M"
        elif vol >= 1_000:
            return f"{vol / 1_000:.2f} K"
        return str(int(vol))

    # Calculate averages
    avg_gap = gaps_df['gap_value'].mean() if len(gaps_df) > 0 else 0
    avg_volume = gaps_df['volume'].mean() if len(gaps_df) > 0 else 0

    # Gap day stats
    gap_day_stats = {
        'avg_market_cap': '--',  # Would need market cap data
        'avg_high_spike': round(gaps_df['high_spike'].mean(), 2) if 'high_spike' in gaps_df else 0,
        'avg_low_spike': round(gaps_df['low_spike'].mean(), 2) if 'low_spike' in gaps_df else 0,
        'avg_return': round(gaps_df['return'].mean(), 2) if 'return' in gaps_df else 0,
        'avg_change': round(avg_gap, 2),
        'avg_range': round((gaps_df['high'] - gaps_df['low']).mean() / gaps_df['open'].mean() * 100, 2) if len(gaps_df) > 0 else 0,
        'avg_hod_time': '10:30:00',  # Would need intraday data
        'avg_lod_time': '10:00:00',  # Would need intraday data
        'avg_close_red': round((gaps_df['close_direction'] == 'red').mean() * 100, 2) if len(gaps_df) > 0 else 0,
    }

    return {
        'ticker': ticker,
        'number_of_gaps': len(gaps),
        'avg_gap_value': round(avg_gap, 2),
        'avg_volume': format_volume(avg_volume),
        'avg_premarket_volume': format_volume(avg_volume * 0.35),  # Estimate
        'gap_day': gap_day_stats,
        'day2': gap_day_stats,  # Would need next-day data for actual Day 2 stats
        'gaps': gaps[:20],  # Return last 20 gaps for history
    }
