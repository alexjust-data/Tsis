from sqlalchemy import Column, Integer, String, Float, Date, Time, Interval, ForeignKey, DateTime, Text, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class TradeSide(str, enum.Enum):
    LONG = "long"
    SHORT = "short"


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Identification
    date = Column(Date, nullable=False, index=True)
    ticker = Column(String(20), nullable=False, index=True)
    side = Column(SQLEnum(TradeSide), nullable=False)

    # Timing
    entry_time = Column(Time, nullable=True)
    exit_time = Column(Time, nullable=True)
    duration_seconds = Column(Integer, nullable=True)  # Duration in seconds

    # Prices
    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float, nullable=False)

    # Position
    shares = Column(Integer, nullable=False)

    # P&L
    pnl = Column(Float, nullable=False)  # Gross P&L
    pnl_percent = Column(Float, nullable=True)  # P&L as percentage
    commissions = Column(Float, default=0.0)  # Total commissions/fees
    net_pnl = Column(Float, nullable=True)  # P&L after commissions

    # Additional metrics (from Excel)
    high_of_day = Column(Float, nullable=True)  # HOD during trade
    low_of_day = Column(Float, nullable=True)  # LOD during trade

    # Notes & metadata
    notes = Column(Text, nullable=True)
    setup = Column(String(100), nullable=True)  # Trading setup used
    screenshot_url = Column(String(500), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="trades")
    tags = relationship("Tag", secondary="trade_tags", back_populates="trades")

    @property
    def is_winner(self) -> bool:
        return self.pnl > 0

    @property
    def r_multiple(self) -> float | None:
        """Calculate R-multiple if we have entry and stop info"""
        if self.entry_price and self.exit_price:
            risk = abs(self.entry_price - self.exit_price)
            if risk > 0:
                return self.pnl / (risk * self.shares)
        return None
