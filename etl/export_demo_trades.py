"""
Export demo trades from Xaviervue Excel to CSV format for import into TSIS.ai

This script reads the 'Trades Zimtra' sheet from the Excel file and converts it
to a CSV format that can be imported into the trading journal.
"""

import pandas as pd
from datetime import datetime, timedelta
import os

# Input file
EXCEL_FILE = r"C:\TSIS_Data\00_CTO\excels\Xaviervue_v3 - demo.xlsx"
OUTPUT_FILE = r"C:\TSIS_Data\00_CTO\excels\demo_trades.csv"


def parse_time(time_str):
    """Parse time string to HH:MM:SS format"""
    if pd.isna(time_str):
        return None
    try:
        if isinstance(time_str, str):
            # Handle format like "07:22:13"
            return time_str
        return str(time_str)
    except:
        return None


def parse_duration(duration_str):
    """Parse duration string to seconds"""
    if pd.isna(duration_str):
        return None
    try:
        if isinstance(duration_str, str):
            parts = duration_str.split(":")
            if len(parts) == 3:
                h, m, s = int(parts[0]), int(parts[1]), int(parts[2])
                return h * 3600 + m * 60 + s
        return None
    except:
        return None


def main():
    print(f"Reading Excel file: {EXCEL_FILE}")

    # Read the Trades Zimtra sheet
    df = pd.read_excel(EXCEL_FILE, sheet_name="Trades Zimtra", header=None)

    # The first row seems to be data, not headers
    # Based on the structure: datetime, date, date, entry_time, exit_time, duration, ticker, side, entry_price, exit_price, shares, pnl, ...

    trades = []

    for idx, row in df.iterrows():
        try:
            # Skip if no ticker
            ticker = row[6]  # Column G
            if pd.isna(ticker) or not isinstance(ticker, str):
                continue

            # Parse date (column C is the date as datetime)
            date_val = row[2]
            if pd.isna(date_val):
                continue

            if isinstance(date_val, datetime):
                trade_date = date_val.strftime("%Y-%m-%d")
            else:
                trade_date = pd.to_datetime(date_val).strftime("%Y-%m-%d")

            # Parse times
            entry_time = parse_time(row[3])  # Column D
            exit_time = parse_time(row[4])   # Column E
            duration = parse_duration(row[5])  # Column F

            # Side (Column H)
            side = str(row[7]).lower() if not pd.isna(row[7]) else "long"
            if side not in ["long", "short"]:
                side = "long"

            # Prices (Columns I and J)
            entry_price = float(row[8]) if not pd.isna(row[8]) else 0
            exit_price = float(row[9]) if not pd.isna(row[9]) else 0

            # Shares (Column K)
            shares = int(float(row[10])) if not pd.isna(row[10]) else 0

            # P&L (Column L)
            pnl = float(row[11]) if not pd.isna(row[11]) else 0

            # Commissions (Column M - appears to be position value, using columns later for fees)
            commissions = 0
            # Try to get actual commissions from later columns if available
            if len(row) > 22 and not pd.isna(row[22]):
                try:
                    commissions = abs(float(row[22]))
                except:
                    pass

            # Skip invalid trades
            if shares <= 0 or entry_price <= 0:
                continue

            trade = {
                "date": trade_date,
                "ticker": ticker.upper().strip(),
                "side": side,
                "entry_time": entry_time,
                "exit_time": exit_time,
                "entry_price": round(entry_price, 4),
                "exit_price": round(exit_price, 4),
                "shares": shares,
                "pnl": round(pnl, 2),
                "commissions": round(commissions, 4),
            }

            trades.append(trade)

        except Exception as e:
            print(f"Error processing row {idx}: {e}")
            continue

    # Create DataFrame and save to CSV
    result_df = pd.DataFrame(trades)

    print(f"\nProcessed {len(trades)} trades")
    print(f"\nSample data:")
    print(result_df.head(10).to_string())

    # Summary stats
    print(f"\n--- Summary ---")
    print(f"Total trades: {len(trades)}")
    print(f"Total P&L: ${result_df['pnl'].sum():.2f}")
    print(f"Unique tickers: {result_df['ticker'].nunique()}")
    print(f"Date range: {result_df['date'].min()} to {result_df['date'].max()}")
    print(f"Long trades: {len(result_df[result_df['side'] == 'long'])}")
    print(f"Short trades: {len(result_df[result_df['side'] == 'short'])}")

    # Save to CSV
    result_df.to_csv(OUTPUT_FILE, index=False)
    print(f"\nSaved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
