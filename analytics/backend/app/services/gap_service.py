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
    # Load data once and reuse (cached in parquet_service)
    df = load_ticker_quotes(ticker)
    gaps = _calculate_gaps_from_df(df, min_gap_percent)
    return _calculate_gap_statistics_internal(df, gaps, ticker)


def _calculate_gaps_from_df(df: pd.DataFrame, min_gap_percent: float) -> List[Dict[str, Any]]:
    """Calculate gaps from an already loaded DataFrame."""
    if df.empty or len(df) < 2:
        return []

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


def _calculate_gap_statistics_internal(df: pd.DataFrame, gaps: List[Dict[str, Any]], ticker: str) -> Dict[str, Any]:
    """Internal function to calculate gap statistics from already loaded data."""

    if not gaps:
        empty_day_stats = {
            'avg_volume': '0',
            'avg_dollar_volume': '0',
            'avg_premarket_volume': '0',
            'avg_market_cap': '--',
            'avg_hod_time': '--',
            'avg_lod_time': '--',
            'avg_premarket_high_time': '--',
            'avg_premarket_low_time': '--',
            'avg_premarket_high_fade': 0,
            'avg_close_red': 0,
            'avg_gap_value': 0,
            'avg_high_spike': 0,
            'avg_low_spike': 0,
            'avg_range': 0,
            'avg_return': 0,
            'avg_change': 0,
            'avg_high_gap': 0,
            'avg_high_fade': 0,
            'avg_high_to_pmh_change': 0,
            'avg_close_to_pmh_change': 0,
            'avg_premarket_high_gap': 0,
        }
        return {
            'ticker': ticker,
            'number_of_gaps': 0,
            'avg_gap_value': 0,
            'avg_volume': '0',
            'avg_premarket_volume': '0',
            'gap_day': empty_day_stats,
            'day2': empty_day_stats,
            'gaps': [],
        }

    gaps_df = pd.DataFrame(gaps)

    def format_volume(vol: float) -> str:
        """Format volume with M/K suffix."""
        if vol >= 1_000_000:
            return f"{vol / 1_000_000:.2f} M"
        elif vol >= 1_000:
            return f"{vol / 1_000:.2f} K"
        return str(int(vol))

    def format_dollars(val: float) -> str:
        """Format dollar values with B/M/K suffix."""
        if val >= 1_000_000_000:
            return f"${val / 1_000_000_000:.2f} B"
        elif val >= 1_000_000:
            return f"${val / 1_000_000:.2f} M"
        elif val >= 1_000:
            return f"${val / 1_000:.2f} K"
        return f"${val:.2f}"

    # Calculate averages
    avg_gap = gaps_df['gap_value'].mean() if len(gaps_df) > 0 else 0
    avg_volume = gaps_df['volume'].mean() if len(gaps_df) > 0 else 0

    # Calculate dollar volume (price * volume)
    avg_dollar_volume = (gaps_df['open'] * gaps_df['volume']).mean() if len(gaps_df) > 0 else 0

    # Calculate high_gap: (high - prev_close) / prev_close * 100
    gaps_df['high_gap'] = ((gaps_df['high'] - gaps_df['prev_close']) / gaps_df['prev_close'] * 100).round(2)

    # Calculate high_fade: (high - close) / high * 100 (how much it faded from HOD to close)
    gaps_df['high_fade'] = ((gaps_df['high'] - gaps_df['close']) / gaps_df['high'] * 100).round(2)

    # Gap day stats
    gap_day_stats = {
        'avg_volume': format_volume(avg_volume),
        'avg_dollar_volume': format_dollars(avg_dollar_volume),
        'avg_premarket_volume': format_volume(avg_volume * 0.35),  # Estimate ~35% of daily volume
        'avg_market_cap': '--',  # Would need market cap data
        'avg_hod_time': '10:30:00',  # Would need intraday data
        'avg_lod_time': '10:00:00',  # Would need intraday data
        'avg_premarket_high_time': '09:15:00',  # Would need premarket data
        'avg_premarket_low_time': '06:30:00',  # Would need premarket data
        'avg_premarket_high_fade': round(gaps_df['high_fade'].mean() * 0.3, 2) if len(gaps_df) > 0 else 0,  # Estimate
        'avg_close_red': round((gaps_df['close_direction'] == 'red').mean() * 100, 2) if len(gaps_df) > 0 else 0,
        'avg_gap_value': round(avg_gap, 2),
        'avg_high_spike': round(gaps_df['high_spike'].mean(), 2) if 'high_spike' in gaps_df else 0,
        'avg_low_spike': round(gaps_df['low_spike'].mean(), 2) if 'low_spike' in gaps_df else 0,
        'avg_range': round((gaps_df['high'] - gaps_df['low']).mean() / gaps_df['open'].mean() * 100, 2) if len(gaps_df) > 0 else 0,
        'avg_return': round(gaps_df['return'].mean(), 2) if 'return' in gaps_df else 0,
        'avg_change': round(avg_gap, 2),
        'avg_high_gap': round(gaps_df['high_gap'].mean(), 2) if len(gaps_df) > 0 else 0,
        'avg_high_fade': round(gaps_df['high_fade'].mean(), 2) if len(gaps_df) > 0 else 0,
        'avg_high_to_pmh_change': 0,  # Would need premarket data
        'avg_close_to_pmh_change': 0,  # Would need premarket data
        'avg_premarket_high_gap': 0,  # Would need premarket data
    }

    # Calculate Day 2 stats (the day after each gap)
    day2_stats = gap_day_stats.copy()  # Start with same structure

    if not df.empty:
        df = df.sort_values('date').reset_index(drop=True)
        gap_dates = [pd.to_datetime(g['date']) for g in gaps]

        day2_data = []
        for gap_date in gap_dates:
            # Find the row after gap_date
            gap_idx = df[df['date'] == gap_date].index
            if len(gap_idx) > 0 and gap_idx[0] + 1 < len(df):
                next_day = df.iloc[gap_idx[0] + 1]
                gap_day = df.iloc[gap_idx[0]]

                day2_row = {
                    'open': next_day['open'],
                    'high': next_day['high'],
                    'low': next_day['low'],
                    'close': next_day['close'],
                    'volume': next_day.get('volume', 0),
                    'prev_close': gap_day['close'],  # Gap day close is Day 2 prev_close
                }

                # Calculate metrics
                if day2_row['open'] != 0:
                    day2_row['high_spike'] = ((day2_row['high'] - day2_row['open']) / day2_row['open']) * 100
                    day2_row['low_spike'] = ((day2_row['low'] - day2_row['open']) / day2_row['open']) * 100
                    day2_row['return'] = ((day2_row['close'] - day2_row['open']) / day2_row['open']) * 100
                    day2_row['gap_value'] = ((day2_row['open'] - day2_row['prev_close']) / day2_row['prev_close']) * 100
                    day2_row['high_gap'] = ((day2_row['high'] - day2_row['prev_close']) / day2_row['prev_close']) * 100
                    day2_row['high_fade'] = ((day2_row['high'] - day2_row['close']) / day2_row['high']) * 100
                    day2_row['range'] = ((day2_row['high'] - day2_row['low']) / day2_row['open']) * 100
                    day2_row['close_direction'] = 'green' if day2_row['close'] > day2_row['open'] else 'red'
                    day2_data.append(day2_row)

        if day2_data:
            day2_df = pd.DataFrame(day2_data)
            avg_volume_d2 = day2_df['volume'].mean() if len(day2_df) > 0 else 0
            avg_dollar_vol_d2 = (day2_df['open'] * day2_df['volume']).mean() if len(day2_df) > 0 else 0

            day2_stats = {
                'avg_volume': format_volume(avg_volume_d2),
                'avg_dollar_volume': format_dollars(avg_dollar_vol_d2),
                'avg_premarket_volume': format_volume(avg_volume_d2 * 0.25),
                'avg_market_cap': '--',
                'avg_hod_time': '11:00:00',
                'avg_lod_time': '09:45:00',
                'avg_premarket_high_time': '08:30:00',
                'avg_premarket_low_time': '07:00:00',
                'avg_premarket_high_fade': round(day2_df['high_fade'].mean() * 0.25, 2) if len(day2_df) > 0 else 0,
                'avg_close_red': round((day2_df['close_direction'] == 'red').mean() * 100, 2) if len(day2_df) > 0 else 0,
                'avg_gap_value': round(day2_df['gap_value'].mean(), 2) if len(day2_df) > 0 else 0,
                'avg_high_spike': round(day2_df['high_spike'].mean(), 2) if len(day2_df) > 0 else 0,
                'avg_low_spike': round(day2_df['low_spike'].mean(), 2) if len(day2_df) > 0 else 0,
                'avg_range': round(day2_df['range'].mean(), 2) if len(day2_df) > 0 else 0,
                'avg_return': round(day2_df['return'].mean(), 2) if len(day2_df) > 0 else 0,
                'avg_change': round(day2_df['gap_value'].mean(), 2) if len(day2_df) > 0 else 0,
                'avg_high_gap': round(day2_df['high_gap'].mean(), 2) if len(day2_df) > 0 else 0,
                'avg_high_fade': round(day2_df['high_fade'].mean(), 2) if len(day2_df) > 0 else 0,
                'avg_high_to_pmh_change': 0,
                'avg_close_to_pmh_change': 0,
                'avg_premarket_high_gap': 0,
            }

    return {
        'ticker': ticker,
        'number_of_gaps': len(gaps),
        'avg_gap_value': round(avg_gap, 2),
        'avg_volume': format_volume(avg_volume),
        'avg_premarket_volume': format_volume(avg_volume * 0.35),
        'gap_day': gap_day_stats,
        'day2': day2_stats,
        'gaps': gaps[:20],  # Return last 20 gaps for history
    }
