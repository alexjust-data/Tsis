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


@router.post("/import", response_model=dict)
async def import_trades(
    db: DbSession,
    current_user: CurrentUser,
    file: UploadFile = File(...)
):
    """Import trades from CSV or Excel file"""
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

        # Map common column names
        column_mapping = {
            "symbol": "ticker",
            "stock": "ticker",
            "direction": "side",
            "type": "side",
            "entry": "entry_price",
            "exit": "exit_price",
            "qty": "shares",
            "quantity": "shares",
            "profit": "pnl",
            "p&l": "pnl",
            "profit/loss": "pnl",
            "fees": "commissions",
            "commission": "commissions",
        }

        df = df.rename(columns=column_mapping)

        trades_created = 0
        errors = []

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
