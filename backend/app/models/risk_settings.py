from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class RiskSettings(Base):
    __tablename__ = "risk_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Account settings
    account_balance = Column(Float, default=10000.0)  # Current account balance

    # Daily limits
    max_loss_daily = Column(Float, default=500.0)  # Max daily loss in $
    max_loss_daily_percent = Column(Float, default=0.05)  # 5% of account

    # Position limits
    max_position = Column(Float, default=5000.0)  # Max position size in $
    max_position_percent = Column(Float, default=0.25)  # 25% of account
    max_shares_per_trade = Column(Integer, default=1000)

    # Order limits
    max_order = Column(Float, default=2500.0)  # Max single order in $
    max_buying_power = Column(Float, default=25000.0)  # Max buying power

    # Risk per trade
    risk_per_trade_percent = Column(Float, default=0.01)  # 1% risk per trade
    max_trades_per_day = Column(Integer, default=10)

    # Alert thresholds (percentage of max daily loss)
    alert_threshold_1 = Column(Float, default=0.30)  # 30% - first warning
    alert_threshold_2 = Column(Float, default=0.50)  # 50% - second warning
    alert_threshold_3 = Column(Float, default=0.75)  # 75% - third warning

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="risk_settings")
