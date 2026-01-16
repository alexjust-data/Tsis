from __future__ import annotations

from typing import Optional, List

from pydantic import BaseModel


class DayStats(BaseModel):
    """Stats for a single day of the week (0=Monday, 6=Sunday)."""
    day_index: int  # 0-6
    day_name: str  # Monday, Tuesday, etc.
    total_pnl: float = 0.0
    trades: int = 0
    winners: int = 0
    losers: int = 0
    win_rate: float = 0.0


class HourStats(BaseModel):
    """Stats for a single hour of the day (0-23)."""
    hour: int  # 0-23
    hour_label: str  # "9 AM", "10 AM", etc.
    total_pnl: float = 0.0
    trades: int = 0
    winners: int = 0
    losers: int = 0
    win_rate: float = 0.0


class DaysTimesResponse(BaseModel):
    """Aggregated data by day of week and hour of day for charts."""
    by_day: List[DayStats] = []
    by_hour: List[HourStats] = []


class DetailedStatsResponse(BaseModel):
    # Monetary / core
    total_gain_loss: float = 0.0
    largest_gain: Optional[float] = None
    largest_loss: Optional[float] = None

    average_daily_gain_loss: float = 0.0
    average_daily_volume: float = 0.0

    average_per_share_gain_loss: float = 0.0
    average_trade_gain_loss: float = 0.0
    average_winning_trade: float = 0.0
    average_losing_trade: float = 0.0

    total_number_of_trades: int = 0
    number_of_winning_trades: int = 0
    number_of_losing_trades: int = 0

    average_hold_time_scratch_trades_seconds: float = 0.0
    average_hold_time_winning_trades_seconds: float = 0.0
    average_hold_time_losing_trades_seconds: float = 0.0

    number_of_scratch_trades: int = 0
    max_consecutive_wins: int = 0
    max_consecutive_losses: int = 0

    trade_pnl_standard_deviation: Optional[float] = None
    system_quality_number_sqn: Optional[float] = None

    probability_of_random_chance: Optional[float] = None

    kelly_percentage: Optional[float] = None
    k_ratio: Optional[float] = None

    profit_factor: Optional[float] = None

    total_commissions: Optional[float] = None
    total_fees: Optional[float] = None

    average_position_mae: Optional[float] = None
    average_position_mfe: Optional[float] = None
