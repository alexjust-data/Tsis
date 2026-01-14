from pydantic import BaseModel, Field
from datetime import date as DateType, time as TimeType, datetime
from typing import Literal, Optional
from app.models.trade import TradeSide


class TradeBase(BaseModel):
    date: DateType
    ticker: str = Field(..., max_length=20)
    side: TradeSide
    entry_time: Optional[TimeType] = None
    exit_time: Optional[TimeType] = None
    duration_seconds: Optional[int] = None
    entry_price: float = Field(..., gt=0)
    exit_price: float = Field(..., gt=0)
    shares: int = Field(..., gt=0)
    pnl: float
    pnl_percent: Optional[float] = None
    commissions: float = 0.0
    net_pnl: Optional[float] = None
    notes: Optional[str] = None
    setup: Optional[str] = None


class TradeCreate(TradeBase):
    tag_ids: list[int] = []


class TradeUpdate(BaseModel):
    date: Optional[DateType] = None
    ticker: Optional[str] = None
    side: Optional[TradeSide] = None
    entry_time: Optional[TimeType] = None
    exit_time: Optional[TimeType] = None
    entry_price: Optional[float] = None
    exit_price: Optional[float] = None
    shares: Optional[int] = None
    pnl: Optional[float] = None
    commissions: Optional[float] = None
    notes: Optional[str] = None
    setup: Optional[str] = None
    tag_ids: Optional[list[int]] = None


class TradeResponse(TradeBase):
    id: int
    user_id: int
    created_at: datetime
    is_winner: bool

    class Config:
        from_attributes = True


class TradeImport(BaseModel):
    """Schema for importing trades from CSV/Excel"""
    date: str  # Will be parsed
    ticker: str
    side: str  # "Long" or "Short"
    entry_time: str | None = None
    exit_time: str | None = None
    entry_price: float
    exit_price: float
    shares: int
    pnl: float
    commissions: float = 0.0
