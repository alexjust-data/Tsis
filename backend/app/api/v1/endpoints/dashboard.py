from datetime import date, timedelta
from fastapi import APIRouter, Query
from sqlalchemy import select, func, case, and_
from collections import defaultdict

from app.api.deps import DbSession, CurrentUser
from app.models.trade import Trade, TradeSide
from app.schemas.dashboard import DashboardMetrics, CalendarDay, MonthlyStats, TickerStats, TimingStats

router = APIRouter()


@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    db: DbSession,
    current_user: CurrentUser,
    start_date: date | None = None,
    end_date: date | None = None,
):
    """Get overall dashboard metrics"""
    query = select(Trade).where(Trade.user_id == current_user.id)

    if start_date:
        query = query.where(Trade.date >= start_date)
    if end_date:
        query = query.where(Trade.date <= end_date)

    result = await db.execute(query)
    trades = result.scalars().all()

    if not trades:
        return DashboardMetrics(
            total_pnl=0, total_trades=0, winning_trades=0, losing_trades=0,
            win_rate=0, avg_win=0, avg_loss=0, avg_pnl_per_trade=0,
            profit_factor=0, best_trade=0, worst_trade=0, best_day=0, worst_day=0,
            long_pnl=0, long_trades=0, long_win_rate=0,
            short_pnl=0, short_trades=0, short_win_rate=0,
            today_pnl=0, week_pnl=0, month_pnl=0,
            current_streak=0, max_win_streak=0, max_loss_streak=0
        )

    # Calculate metrics
    total_pnl = sum(t.pnl for t in trades)
    total_trades = len(trades)
    winning_trades = [t for t in trades if t.pnl > 0]
    losing_trades = [t for t in trades if t.pnl < 0]

    win_rate = len(winning_trades) / total_trades * 100 if total_trades > 0 else 0
    avg_win = sum(t.pnl for t in winning_trades) / len(winning_trades) if winning_trades else 0
    avg_loss = sum(t.pnl for t in losing_trades) / len(losing_trades) if losing_trades else 0
    avg_pnl_per_trade = total_pnl / total_trades if total_trades > 0 else 0

    gross_profit = sum(t.pnl for t in winning_trades)
    gross_loss = abs(sum(t.pnl for t in losing_trades))
    profit_factor = gross_profit / gross_loss if gross_loss > 0 else gross_profit

    best_trade = max(t.pnl for t in trades) if trades else 0
    worst_trade = min(t.pnl for t in trades) if trades else 0

    # Daily P&L
    daily_pnl = defaultdict(float)
    for t in trades:
        daily_pnl[t.date] += t.pnl
    best_day = max(daily_pnl.values()) if daily_pnl else 0
    worst_day = min(daily_pnl.values()) if daily_pnl else 0

    # By side
    long_trades_list = [t for t in trades if t.side == TradeSide.LONG]
    short_trades_list = [t for t in trades if t.side == TradeSide.SHORT]

    long_pnl = sum(t.pnl for t in long_trades_list)
    long_trades_count = len(long_trades_list)
    long_winners = len([t for t in long_trades_list if t.pnl > 0])
    long_win_rate = long_winners / long_trades_count * 100 if long_trades_count > 0 else 0

    short_pnl = sum(t.pnl for t in short_trades_list)
    short_trades_count = len(short_trades_list)
    short_winners = len([t for t in short_trades_list if t.pnl > 0])
    short_win_rate = short_winners / short_trades_count * 100 if short_trades_count > 0 else 0

    # Period P&L
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)

    today_pnl = sum(t.pnl for t in trades if t.date == today)
    week_pnl = sum(t.pnl for t in trades if t.date >= week_start)
    month_pnl = sum(t.pnl for t in trades if t.date >= month_start)

    # Streaks
    sorted_trades = sorted(trades, key=lambda t: (t.date, t.entry_time or "00:00"))
    current_streak = 0
    max_win_streak = 0
    max_loss_streak = 0
    temp_win_streak = 0
    temp_loss_streak = 0

    for t in sorted_trades:
        if t.pnl > 0:
            temp_win_streak += 1
            temp_loss_streak = 0
            max_win_streak = max(max_win_streak, temp_win_streak)
        elif t.pnl < 0:
            temp_loss_streak += 1
            temp_win_streak = 0
            max_loss_streak = max(max_loss_streak, temp_loss_streak)

    if sorted_trades:
        last_trade = sorted_trades[-1]
        if last_trade.pnl > 0:
            current_streak = temp_win_streak
        elif last_trade.pnl < 0:
            current_streak = -temp_loss_streak

    return DashboardMetrics(
        total_pnl=round(total_pnl, 2),
        total_trades=total_trades,
        winning_trades=len(winning_trades),
        losing_trades=len(losing_trades),
        win_rate=round(win_rate, 2),
        avg_win=round(avg_win, 2),
        avg_loss=round(avg_loss, 2),
        avg_pnl_per_trade=round(avg_pnl_per_trade, 2),
        profit_factor=round(profit_factor, 2),
        best_trade=round(best_trade, 2),
        worst_trade=round(worst_trade, 2),
        best_day=round(best_day, 2),
        worst_day=round(worst_day, 2),
        long_pnl=round(long_pnl, 2),
        long_trades=long_trades_count,
        long_win_rate=round(long_win_rate, 2),
        short_pnl=round(short_pnl, 2),
        short_trades=short_trades_count,
        short_win_rate=round(short_win_rate, 2),
        today_pnl=round(today_pnl, 2),
        week_pnl=round(week_pnl, 2),
        month_pnl=round(month_pnl, 2),
        current_streak=current_streak,
        max_win_streak=max_win_streak,
        max_loss_streak=max_loss_streak
    )


@router.get("/calendar/{year}/{month}", response_model=MonthlyStats)
async def get_monthly_calendar(
    year: int,
    month: int,
    db: DbSession,
    current_user: CurrentUser,
):
    """Get calendar view for a specific month"""
    from calendar import monthrange

    # Get first and last day of month
    first_day = date(year, month, 1)
    last_day = date(year, month, monthrange(year, month)[1])

    query = select(Trade).where(
        Trade.user_id == current_user.id,
        Trade.date >= first_day,
        Trade.date <= last_day
    )

    result = await db.execute(query)
    trades = result.scalars().all()

    # Group by date
    daily_data = defaultdict(lambda: {"pnl": 0, "trades": 0, "wins": 0})
    for t in trades:
        daily_data[t.date]["pnl"] += t.pnl
        daily_data[t.date]["trades"] += 1
        if t.pnl > 0:
            daily_data[t.date]["wins"] += 1

    # Build calendar
    calendar = []
    for day_date, data in sorted(daily_data.items()):
        win_rate = data["wins"] / data["trades"] * 100 if data["trades"] > 0 else 0
        calendar.append(CalendarDay(
            date=day_date,
            pnl=round(data["pnl"], 2),
            trades=data["trades"],
            win_rate=round(win_rate, 2),
            is_green=data["pnl"] > 0
        ))

    # Monthly stats
    total_pnl = sum(d["pnl"] for d in daily_data.values())
    total_trades = sum(d["trades"] for d in daily_data.values())
    total_wins = sum(d["wins"] for d in daily_data.values())
    trading_days = len(daily_data)

    return MonthlyStats(
        month=month,
        year=year,
        total_pnl=round(total_pnl, 2),
        total_trades=total_trades,
        win_rate=round(total_wins / total_trades * 100 if total_trades > 0 else 0, 2),
        trading_days=trading_days,
        avg_daily_pnl=round(total_pnl / trading_days if trading_days > 0 else 0, 2),
        best_day=round(max((d["pnl"] for d in daily_data.values()), default=0), 2),
        worst_day=round(min((d["pnl"] for d in daily_data.values()), default=0), 2),
        calendar=calendar
    )


@router.get("/tickers", response_model=list[TickerStats])
async def get_ticker_stats(
    db: DbSession,
    current_user: CurrentUser,
    limit: int = Query(10, ge=1, le=50),
    start_date: date | None = None,
    end_date: date | None = None,
):
    """Get top tickers by P&L"""
    query = select(Trade).where(Trade.user_id == current_user.id)

    if start_date:
        query = query.where(Trade.date >= start_date)
    if end_date:
        query = query.where(Trade.date <= end_date)

    result = await db.execute(query)
    trades = result.scalars().all()

    # Group by ticker
    ticker_data = defaultdict(lambda: {"pnl": 0, "trades": 0, "wins": 0})
    for t in trades:
        ticker_data[t.ticker]["pnl"] += t.pnl
        ticker_data[t.ticker]["trades"] += 1
        if t.pnl > 0:
            ticker_data[t.ticker]["wins"] += 1

    # Sort by absolute P&L and limit
    sorted_tickers = sorted(ticker_data.items(), key=lambda x: abs(x[1]["pnl"]), reverse=True)[:limit]

    return [
        TickerStats(
            ticker=ticker,
            total_pnl=round(data["pnl"], 2),
            trades=data["trades"],
            win_rate=round(data["wins"] / data["trades"] * 100 if data["trades"] > 0 else 0, 2),
            avg_pnl=round(data["pnl"] / data["trades"] if data["trades"] > 0 else 0, 2)
        )
        for ticker, data in sorted_tickers
    ]


@router.get("/timing", response_model=list[TimingStats])
async def get_timing_stats(
    db: DbSession,
    current_user: CurrentUser,
    start_date: date | None = None,
    end_date: date | None = None,
):
    """Get trading performance by hour of day"""
    query = select(Trade).where(
        Trade.user_id == current_user.id,
        Trade.entry_time.isnot(None)
    )

    if start_date:
        query = query.where(Trade.date >= start_date)
    if end_date:
        query = query.where(Trade.date <= end_date)

    result = await db.execute(query)
    trades = result.scalars().all()

    # Group by hour
    hour_data = defaultdict(lambda: {"pnl": 0, "trades": 0, "wins": 0, "duration": 0})
    for t in trades:
        if t.entry_time:
            hour = t.entry_time.hour
            hour_data[hour]["pnl"] += t.pnl
            hour_data[hour]["trades"] += 1
            if t.pnl > 0:
                hour_data[hour]["wins"] += 1
            if t.duration_seconds:
                hour_data[hour]["duration"] += t.duration_seconds

    return [
        TimingStats(
            hour=hour,
            total_pnl=round(data["pnl"], 2),
            trades=data["trades"],
            win_rate=round(data["wins"] / data["trades"] * 100 if data["trades"] > 0 else 0, 2),
            avg_duration_minutes=round(data["duration"] / data["trades"] / 60 if data["trades"] > 0 else 0, 2)
        )
        for hour, data in sorted(hour_data.items())
    ]
