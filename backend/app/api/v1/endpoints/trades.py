from datetime import date, datetime, time
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Query
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
import pandas as pd
import io

from app.api.deps import DbSession, CurrentUser
from app.models.trade import Trade, TradeSide
from app.models.tag import Tag
from app.schemas.trade import TradeCreate, TradeUpdate, TradeResponse

router = APIRouter()


@router.get("/", response_model=list[TradeResponse])
async def get_trades(
    db: DbSession,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    ticker: str | None = None,
    side: TradeSide | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    """Get all trades for current user with optional filters"""
    query = select(Trade).where(Trade.user_id == current_user.id)

    if ticker:
        query = query.where(Trade.ticker == ticker.upper())
    if side:
        query = query.where(Trade.side == side)
    if start_date:
        query = query.where(Trade.date >= start_date)
    if end_date:
        query = query.where(Trade.date <= end_date)

    query = query.order_by(Trade.date.desc(), Trade.entry_time.desc())
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    trades = result.scalars().all()

    return trades


@router.post("/", response_model=TradeResponse, status_code=status.HTTP_201_CREATED)
async def create_trade(trade_data: TradeCreate, db: DbSession, current_user: CurrentUser):
    """Create a new trade"""
    # Calculate net_pnl
    net_pnl = trade_data.pnl - trade_data.commissions

    trade = Trade(
        user_id=current_user.id,
        date=trade_data.date,
        ticker=trade_data.ticker.upper(),
        side=trade_data.side,
        entry_time=trade_data.entry_time,
        exit_time=trade_data.exit_time,
        duration_seconds=trade_data.duration_seconds,
        entry_price=trade_data.entry_price,
        exit_price=trade_data.exit_price,
        shares=trade_data.shares,
        pnl=trade_data.pnl,
        pnl_percent=trade_data.pnl_percent,
        commissions=trade_data.commissions,
        net_pnl=net_pnl,
        notes=trade_data.notes,
        setup=trade_data.setup,
    )

    db.add(trade)
    await db.commit()
    await db.refresh(trade)

    return trade


@router.get("/{trade_id}", response_model=TradeResponse)
async def get_trade(trade_id: int, db: DbSession, current_user: CurrentUser):
    """Get a specific trade"""
    result = await db.execute(
        select(Trade).where(Trade.id == trade_id, Trade.user_id == current_user.id)
    )
    trade = result.scalar_one_or_none()

    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    return trade


@router.put("/{trade_id}", response_model=TradeResponse)
async def update_trade(
    trade_id: int,
    trade_data: TradeUpdate,
    db: DbSession,
    current_user: CurrentUser
):
    """Update a trade"""
    result = await db.execute(
        select(Trade).where(Trade.id == trade_id, Trade.user_id == current_user.id)
    )
    trade = result.scalar_one_or_none()

    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    update_data = trade_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field == "tag_ids":
            continue
        if field == "ticker" and value:
            value = value.upper()
        setattr(trade, field, value)

    # Recalculate net_pnl if pnl or commissions changed
    if "pnl" in update_data or "commissions" in update_data:
        trade.net_pnl = trade.pnl - trade.commissions

    await db.commit()
    await db.refresh(trade)

    return trade


@router.delete("/{trade_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trade(trade_id: int, db: DbSession, current_user: CurrentUser):
    """Delete a trade"""
    result = await db.execute(
        select(Trade).where(Trade.id == trade_id, Trade.user_id == current_user.id)
    )
    trade = result.scalar_one_or_none()

    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    await db.delete(trade)
    await db.commit()


def _is_tradervue_format(df: pd.DataFrame) -> bool:
    """Check if the dataframe is in Tradervue execution format."""
    cols = set(df.columns)
    # Tradervue has: Date, Time, Symbol, Quantity, Price, Side
    # But NOT entry_price/exit_price (those are complete trade formats)
    has_tradervue_cols = {"symbol", "price", "quantity", "side"}.issubset(cols)
    has_trade_cols = "entry_price" in cols or "exit_price" in cols
    return has_tradervue_cols and not has_trade_cols


def _process_tradervue_executions(df: pd.DataFrame) -> list[dict]:
    """
    Convert Tradervue executions into complete trades.
    Tradervue format: Date, Time, Symbol, Quantity, Price, Side
    Side values: B (buy), S (sell), SS (sell short), BC (buy to cover)
    """
    trades = []

    # Group by Symbol and Date to find matching entries/exits
    for (symbol, trade_date), group in df.groupby(["symbol", "date"]):
        # Separate entries and exits
        # Long entries: B (buy) | Long exits: S (sell)
        # Short entries: SS (sell short) | Short exits: BC (buy to cover)
        entries = []
        exits = []

        for _, row in group.iterrows():
            side = str(row["side"]).upper().strip()
            qty = abs(int(float(row.get("quantity", 0))))
            price = float(row.get("price", 0))
            exec_time = row.get("time")
            # Handle NaN values for optional fee columns
            comm = float(row.get("commission", 0)) if pd.notna(row.get("commission")) else 0
            transfee = float(row.get("transfee", 0)) if pd.notna(row.get("transfee")) else 0
            ecnfee = float(row.get("ecnfee", 0)) if pd.notna(row.get("ecnfee")) else 0
            commission = comm + transfee + ecnfee

            if side in ("B", "BUY"):  # Long entry
                entries.append({"qty": qty, "price": price, "time": exec_time, "comm": commission, "type": "long"})
            elif side in ("S", "SELL"):  # Long exit
                exits.append({"qty": qty, "price": price, "time": exec_time, "comm": commission, "type": "long"})
            elif side in ("SS", "SELLSHORT", "SHORT"):  # Short entry
                entries.append({"qty": qty, "price": price, "time": exec_time, "comm": commission, "type": "short"})
            elif side in ("BC", "BUYTOCOVER", "COVER"):  # Short exit
                exits.append({"qty": qty, "price": price, "time": exec_time, "comm": commission, "type": "short"})

        # Match entries with exits to create trades
        # Simple FIFO matching by type
        for trade_type in ["long", "short"]:
            type_entries = [e for e in entries if e["type"] == trade_type]
            type_exits = [e for e in exits if e["type"] == trade_type]

            if not type_entries or not type_exits:
                continue

            # Calculate weighted average entry and exit prices
            total_entry_qty = sum(e["qty"] for e in type_entries)
            total_exit_qty = sum(e["qty"] for e in type_exits)
            shares = min(total_entry_qty, total_exit_qty)

            if shares <= 0:
                continue

            avg_entry = sum(e["qty"] * e["price"] for e in type_entries) / total_entry_qty
            avg_exit = sum(e["qty"] * e["price"] for e in type_exits) / total_exit_qty
            total_comm = sum(e["comm"] for e in type_entries) + sum(e["comm"] for e in type_exits)

            # Calculate P&L
            if trade_type == "long":
                pnl = (avg_exit - avg_entry) * shares
            else:
                pnl = (avg_entry - avg_exit) * shares

            # Get times
            entry_time = type_entries[0]["time"] if type_entries else None
            exit_time = type_exits[-1]["time"] if type_exits else None

            trades.append({
                "date": trade_date,
                "ticker": symbol,
                "side": trade_type,
                "entry_price": avg_entry,
                "exit_price": avg_exit,
                "shares": shares,
                "pnl": pnl,
                "commissions": total_comm,
                "entry_time": entry_time,
                "exit_time": exit_time,
            })

    return trades


@router.post("/import", response_model=dict)
async def import_trades(
    db: DbSession,
    current_user: CurrentUser,
    file: UploadFile = File(...)
):
    """Import trades from CSV or Excel file. Supports both complete trades and Tradervue execution format."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Check file extension
    filename = file.filename.lower()
    if not (filename.endswith(".csv") or filename.endswith(".xlsx") or filename.endswith(".xls")):
        raise HTTPException(
            status_code=400,
            detail="File must be CSV or Excel format"
        )

    try:
        contents = await file.read()

        # Parse file
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))

        # Normalize column names
        df.columns = df.columns.str.strip().str.lower()

        # Map common column names (keeping original for mapping)
        column_mapping = {
            "stock": "ticker",
            "direction": "side",
            "type": "side",
            "entry": "entry_price",
            "exit": "exit_price",
            "qty": "shares",
            "profit": "pnl",
            "p&l": "pnl",
            "profit/loss": "pnl",
            "fees": "commissions",
            "commission": "commissions",
        }

        df = df.rename(columns=column_mapping)

        trades_created = 0
        errors = []

        # Check if this is Tradervue execution format
        if _is_tradervue_format(df):
            # Parse dates first for grouping
            if "date" in df.columns:
                df["date"] = pd.to_datetime(df["date"]).dt.date

            # Process executions into trades
            trade_dicts = _process_tradervue_executions(df)

            for trade_dict in trade_dicts:
                try:
                    entry_time = None
                    exit_time = None
                    if trade_dict.get("entry_time") and pd.notna(trade_dict["entry_time"]):
                        entry_time = pd.to_datetime(str(trade_dict["entry_time"])).time()
                    if trade_dict.get("exit_time") and pd.notna(trade_dict["exit_time"]):
                        exit_time = pd.to_datetime(str(trade_dict["exit_time"])).time()

                    # Calculate duration_seconds from entry and exit times
                    duration_seconds = None
                    if entry_time and exit_time:
                        entry_dt = datetime.combine(trade_dict["date"], entry_time)
                        exit_dt = datetime.combine(trade_dict["date"], exit_time)
                        duration_seconds = int((exit_dt - entry_dt).total_seconds())
                        if duration_seconds < 0:
                            duration_seconds = None  # Handle overnight trades

                    trade = Trade(
                        user_id=current_user.id,
                        date=trade_dict["date"],
                        ticker=str(trade_dict["ticker"]).upper().strip(),
                        side=TradeSide.SHORT if trade_dict["side"] == "short" else TradeSide.LONG,
                        entry_time=entry_time,
                        exit_time=exit_time,
                        duration_seconds=duration_seconds,
                        entry_price=trade_dict["entry_price"],
                        exit_price=trade_dict["exit_price"],
                        shares=trade_dict["shares"],
                        pnl=trade_dict["pnl"],
                        commissions=trade_dict["commissions"],
                        net_pnl=trade_dict["pnl"] - trade_dict["commissions"],
                    )

                    db.add(trade)
                    trades_created += 1
                except Exception as e:
                    errors.append(f"Trade {trade_dict.get('ticker', 'unknown')}: {str(e)}")
        else:
            # Original complete trade format
            # Map symbol to ticker if present
            if "symbol" in df.columns and "ticker" not in df.columns:
                df = df.rename(columns={"symbol": "ticker"})
            if "quantity" in df.columns and "shares" not in df.columns:
                df = df.rename(columns={"quantity": "shares"})

            for idx, row in df.iterrows():
                try:
                    # Parse date
                    trade_date = pd.to_datetime(row.get("date")).date() if "date" in row else date.today()

                    # Parse side
                    side_str = str(row.get("side", "long")).lower()
                    side = TradeSide.SHORT if "short" in side_str else TradeSide.LONG

                    # Parse times
                    entry_time = None
                    exit_time = None
                    if "entry_time" in row and pd.notna(row["entry_time"]):
                        entry_time = pd.to_datetime(str(row["entry_time"])).time()
                    if "exit_time" in row and pd.notna(row["exit_time"]):
                        exit_time = pd.to_datetime(str(row["exit_time"])).time()

                    # Calculate duration_seconds from entry and exit times
                    duration_seconds = None
                    if entry_time and exit_time:
                        entry_dt = datetime.combine(trade_date, entry_time)
                        exit_dt = datetime.combine(trade_date, exit_time)
                        duration_seconds = int((exit_dt - entry_dt).total_seconds())
                        if duration_seconds < 0:
                            duration_seconds = None  # Handle overnight trades

                    # Get numeric values
                    entry_price = float(row.get("entry_price", 0))
                    exit_price = float(row.get("exit_price", 0))
                    shares = int(float(row.get("shares", 0)))
                    pnl = float(row.get("pnl", 0))
                    commissions = float(row.get("commissions", 0)) if "commissions" in row else 0

                    # Skip invalid rows
                    if not row.get("ticker") or shares <= 0:
                        continue

                    trade = Trade(
                        user_id=current_user.id,
                        date=trade_date,
                        ticker=str(row["ticker"]).upper().strip(),
                        side=side,
                        entry_time=entry_time,
                        exit_time=exit_time,
                        duration_seconds=duration_seconds,
                        entry_price=entry_price,
                        exit_price=exit_price,
                        shares=shares,
                        pnl=pnl,
                        commissions=commissions,
                        net_pnl=pnl - commissions,
                    )

                    db.add(trade)
                    trades_created += 1

                except Exception as e:
                    errors.append(f"Row {idx + 1}: {str(e)}")

        await db.commit()

        return {
            "message": f"Successfully imported {trades_created} trades",
            "trades_created": trades_created,
            "errors": errors[:10] if errors else []  # Return first 10 errors
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_trades(db: DbSession, current_user: CurrentUser):
    """Delete all trades for current user"""
    await db.execute(delete(Trade).where(Trade.user_id == current_user.id))
    await db.commit()


@router.post("/recalculate-durations", response_model=dict)
async def recalculate_durations(db: DbSession, current_user: CurrentUser):
    """Recalculate duration_seconds for all trades that have entry_time and exit_time."""
    result = await db.execute(
        select(Trade).where(Trade.user_id == current_user.id)
    )
    trades = result.scalars().all()

    updated_count = 0
    for trade in trades:
        if trade.entry_time and trade.exit_time and trade.duration_seconds is None:
            entry_dt = datetime.combine(trade.date, trade.entry_time)
            exit_dt = datetime.combine(trade.date, trade.exit_time)
            duration = int((exit_dt - entry_dt).total_seconds())
            if duration >= 0:
                trade.duration_seconds = duration
                updated_count += 1

    await db.commit()

    return {
        "message": f"Successfully recalculated durations for {updated_count} trades",
        "trades_updated": updated_count
    }
