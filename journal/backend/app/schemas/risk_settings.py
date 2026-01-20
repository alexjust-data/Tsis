from pydantic import BaseModel, Field
from datetime import datetime


class RiskSettingsBase(BaseModel):
    account_balance: float = Field(default=10000.0, gt=0)
    max_loss_daily: float = Field(default=500.0, gt=0)
    max_loss_daily_percent: float = Field(default=0.05, gt=0, le=1)
    max_position: float = Field(default=5000.0, gt=0)
    max_position_percent: float = Field(default=0.25, gt=0, le=1)
    max_shares_per_trade: int = Field(default=1000, gt=0)
    max_order: float = Field(default=2500.0, gt=0)
    max_buying_power: float = Field(default=25000.0, gt=0)
    risk_per_trade_percent: float = Field(default=0.01, gt=0, le=1)
    max_trades_per_day: int = Field(default=10, gt=0)
    alert_threshold_1: float = Field(default=0.30, gt=0, le=1)
    alert_threshold_2: float = Field(default=0.50, gt=0, le=1)
    alert_threshold_3: float = Field(default=0.75, gt=0, le=1)


class RiskSettingsCreate(RiskSettingsBase):
    pass


class RiskSettingsUpdate(BaseModel):
    account_balance: float | None = None
    max_loss_daily: float | None = None
    max_loss_daily_percent: float | None = None
    max_position: float | None = None
    max_position_percent: float | None = None
    max_shares_per_trade: int | None = None
    max_order: float | None = None
    max_buying_power: float | None = None
    risk_per_trade_percent: float | None = None
    max_trades_per_day: int | None = None
    alert_threshold_1: float | None = None
    alert_threshold_2: float | None = None
    alert_threshold_3: float | None = None


class RiskSettingsResponse(RiskSettingsBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True
