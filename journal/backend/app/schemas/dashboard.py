from pydantic import BaseModel
from datetime import date


class DashboardMetrics(BaseModel):
    # Overall P&L
    total_pnl: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float  # Percentage

    # Averages
    avg_win: float
    avg_loss: float
    avg_pnl_per_trade: float
    profit_factor: float  # gross profit / gross loss

    # Best/Worst
    best_trade: float
    worst_trade: float
    best_day: float
    worst_day: float

    # By side
    long_pnl: float
    long_trades: int
    long_win_rate: float
    short_pnl: float
    short_trades: int
    short_win_rate: float

    # Current period
    today_pnl: float
    week_pnl: float
    month_pnl: float

    # Streaks
    current_streak: int  # positive = wins, negative = losses
    max_win_streak: int
    max_loss_streak: int


class CalendarDay(BaseModel):
    date: date
    pnl: float
    trades: int
    win_rate: float
    is_green: bool  # True if profitable


class MonthlyStats(BaseModel):
    month: int
    year: int
    total_pnl: float
    total_trades: int
    win_rate: float
    trading_days: int
    avg_daily_pnl: float
    best_day: float
    worst_day: float
    calendar: list[CalendarDay]


class TickerStats(BaseModel):
    ticker: str
    total_pnl: float
    trades: int
    win_rate: float
    avg_pnl: float


class TimingStats(BaseModel):
    hour: int
    total_pnl: float
    trades: int
    win_rate: float
    avg_duration_minutes: float
