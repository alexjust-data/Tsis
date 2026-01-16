from __future__ import annotations

from datetime import date
from math import sqrt
from typing import Optional

from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import DbSession, CurrentUser
from app.models.trade import Trade, TradeSide
from app.schemas.reports import (
    DetailedStatsResponse,
    DaysTimesResponse, DayStats, HourStats,
    PriceVolumeResponse, PriceRangeStats, VolumeRangeStats,
)

router = APIRouter()


def _safe_div(num: float, den: float) -> float:
    return num / den if den else 0.0


def _stddev(values: list[float]) -> float:
    # population stddev (stable enough for UI)
    n = len(values)
    if n < 2:
        return 0.0
    mean = sum(values) / n
    var = sum((x - mean) ** 2 for x in values) / (n - 1)
    return sqrt(var)


@router.get("/detailed/stats", response_model=DetailedStatsResponse)
async def detailed_stats(
    db: DbSession,
    current_user: CurrentUser,
    ticker: Optional[str] = None,
    side: Optional[TradeSide] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    """Aggregated stats for Reports > Detailed.

    Note: Some fields (MAE/MFE, Probability of Random Chance, K-Ratio) require extra data
    not present in the current Trade model, so they are returned as null.
    """

    q = select(Trade).where(Trade.user_id == current_user.id)
    if ticker:
        q = q.where(Trade.ticker == ticker.upper())
    if side:
        q = q.where(Trade.side == side)
    if start_date:
        q = q.where(Trade.date >= start_date)
    if end_date:
        q = q.where(Trade.date <= end_date)

    q = q.order_by(Trade.date.asc(), Trade.entry_time.asc())

    res = await db.execute(q)
    trades = res.scalars().all()

    if not trades:
        return DetailedStatsResponse()

    pnls = [float(t.pnl) for t in trades]
    winners = [t for t in trades if t.pnl > 0]
    losers = [t for t in trades if t.pnl < 0]
    scratches = [t for t in trades if t.pnl == 0]

    total_gain_loss = sum(pnls)
    largest_gain = max(pnls) if pnls else 0.0
    largest_loss = min(pnls) if pnls else 0.0

    # daily
    by_day: dict[date, list[Trade]] = {}
    for t in trades:
        by_day.setdefault(t.date, []).append(t)
    daily_pnls = [sum(float(x.pnl) for x in day_trades) for day_trades in by_day.values()]
    avg_daily_gain_loss = sum(daily_pnls) / len(daily_pnls) if daily_pnls else 0.0
    avg_daily_volume = sum(len(v) for v in by_day.values()) / len(by_day) if by_day else 0.0

    avg_trade_gain_loss = total_gain_loss / len(trades) if trades else 0.0
    avg_winning_trade = sum(float(t.pnl) for t in winners) / len(winners) if winners else 0.0
    avg_losing_trade = sum(float(t.pnl) for t in losers) / len(losers) if losers else 0.0

    # per-share gain/loss (avg of pnl/shares)
    per_share = [float(t.pnl) / float(t.shares) for t in trades if t.shares]
    avg_per_share_gain_loss = sum(per_share) / len(per_share) if per_share else 0.0

    # hold times
    def avg_hold(trs: list[Trade]) -> float:
        vals = [float(t.duration_seconds) for t in trs if t.duration_seconds is not None]
        return (sum(vals) / len(vals)) if vals else 0.0

    avg_hold_time_scratch = avg_hold(scratches)
    avg_hold_time_winning = avg_hold(winners)
    avg_hold_time_losing = avg_hold(losers)

    # streaks
    max_consecutive_wins = 0
    max_consecutive_losses = 0
    cur_w = 0
    cur_l = 0
    for t in trades:
        if t.pnl > 0:
            cur_w += 1
            cur_l = 0
        elif t.pnl < 0:
            cur_l += 1
            cur_w = 0
        else:
            # scratch resets both
            cur_w = 0
            cur_l = 0
        max_consecutive_wins = max(max_consecutive_wins, cur_w)
        max_consecutive_losses = max(max_consecutive_losses, cur_l)

    gross_profit = sum(float(t.pnl) for t in winners)
    gross_loss = abs(sum(float(t.pnl) for t in losers))
    profit_factor = _safe_div(gross_profit, gross_loss) if gross_loss > 0 else gross_profit

    trade_pnl_std_dev = _stddev(pnls)

    # SQN: mean(R) / std(R) * sqrt(n). Use pnl as a proxy for R until risk is modeled.
    mean_r = sum(pnls) / len(pnls) if pnls else 0.0
    std_r = trade_pnl_std_dev
    sqn = (mean_r / std_r) * sqrt(len(pnls)) if std_r > 0 else 0.0

    # Kelly
    p = len(winners) / len(trades) if trades else 0.0
    b = _safe_div(avg_winning_trade, abs(avg_losing_trade)) if avg_losing_trade else 0.0
    kelly = (p - (1 - p) / b) if b > 0 else 0.0

    total_commissions = sum(float(getattr(t, "commissions", 0.0) or 0.0) for t in trades)

    return DetailedStatsResponse(
        total_gain_loss=round(total_gain_loss, 2),
        largest_gain=None if pnls is None else (round(largest_gain, 2) if pnls else 0.0),
        largest_loss=None if pnls is None else (round(largest_loss, 2) if pnls else 0.0),
        average_daily_gain_loss=round(avg_daily_gain_loss, 2),
        average_daily_volume=round(avg_daily_volume, 2),
        average_per_share_gain_loss=round(avg_per_share_gain_loss, 4),
        average_trade_gain_loss=round(avg_trade_gain_loss, 2),
        average_winning_trade=round(avg_winning_trade, 2),
        average_losing_trade=round(avg_losing_trade, 2),
        total_number_of_trades=len(trades),
        number_of_winning_trades=len(winners),
        number_of_losing_trades=len(losers),
        average_hold_time_scratch_trades_seconds=round(avg_hold_time_scratch, 2),
        average_hold_time_winning_trades_seconds=round(avg_hold_time_winning, 2),
        average_hold_time_losing_trades_seconds=round(avg_hold_time_losing, 2),
        number_of_scratch_trades=len(scratches),
        max_consecutive_wins=max_consecutive_wins,
        max_consecutive_losses=max_consecutive_losses,
        trade_pnl_standard_deviation=round(trade_pnl_std_dev, 2),
        system_quality_number_sqn=round(sqn, 2),
        kelly_percentage=round(kelly * 100, 2),
        profit_factor=round(profit_factor, 2),
        total_commissions=round(total_commissions, 2),
        total_fees=round(total_commissions, 2),
        # Not available with current data model
        probability_of_random_chance=None,
        k_ratio=None,
        average_position_mae=None,
        average_position_mfe=None,
    )


DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _hour_label(hour: int) -> str:
    """Convert 24h hour to 12h label."""
    if hour == 0:
        return "12 AM"
    elif hour < 12:
        return f"{hour} AM"
    elif hour == 12:
        return "12 PM"
    else:
        return f"{hour - 12} PM"


@router.get("/detailed/days-times", response_model=DaysTimesResponse)
async def days_times_stats(
    db: DbSession,
    current_user: CurrentUser,
    ticker: Optional[str] = None,
    side: Optional[TradeSide] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    """Aggregated stats by day of week and hour of day for charts."""

    q = select(Trade).where(Trade.user_id == current_user.id)
    if ticker:
        q = q.where(Trade.ticker == ticker.upper())
    if side:
        q = q.where(Trade.side == side)
    if start_date:
        q = q.where(Trade.date >= start_date)
    if end_date:
        q = q.where(Trade.date <= end_date)

    res = await db.execute(q)
    trades = res.scalars().all()

    if not trades:
        return DaysTimesResponse(by_day=[], by_hour=[])

    # Aggregate by day of week (0=Monday, 6=Sunday)
    day_data: dict[int, dict] = {i: {"pnl": 0.0, "trades": 0, "winners": 0, "losers": 0} for i in range(7)}
    # Aggregate by hour (0-23)
    hour_data: dict[int, dict] = {i: {"pnl": 0.0, "trades": 0, "winners": 0, "losers": 0} for i in range(24)}

    for t in trades:
        # Day of week from trade date
        dow = t.date.weekday()  # 0=Monday
        day_data[dow]["pnl"] += float(t.pnl)
        day_data[dow]["trades"] += 1
        if t.pnl > 0:
            day_data[dow]["winners"] += 1
        elif t.pnl < 0:
            day_data[dow]["losers"] += 1

        # Hour from entry_time
        if t.entry_time:
            hour = t.entry_time.hour
            hour_data[hour]["pnl"] += float(t.pnl)
            hour_data[hour]["trades"] += 1
            if t.pnl > 0:
                hour_data[hour]["winners"] += 1
            elif t.pnl < 0:
                hour_data[hour]["losers"] += 1

    # Build response
    by_day = []
    for i in range(7):
        d = day_data[i]
        win_rate = _safe_div(d["winners"], d["trades"]) * 100 if d["trades"] > 0 else 0.0
        by_day.append(DayStats(
            day_index=i,
            day_name=DAY_NAMES[i],
            total_pnl=round(d["pnl"], 2),
            trades=d["trades"],
            winners=d["winners"],
            losers=d["losers"],
            win_rate=round(win_rate, 1),
        ))

    by_hour = []
    for i in range(24):
        h = hour_data[i]
        if h["trades"] > 0:  # Only include hours with trades
            win_rate = _safe_div(h["winners"], h["trades"]) * 100
            by_hour.append(HourStats(
                hour=i,
                hour_label=_hour_label(i),
                total_pnl=round(h["pnl"], 2),
                trades=h["trades"],
                winners=h["winners"],
                losers=h["losers"],
                win_rate=round(win_rate, 1),
            ))

    return DaysTimesResponse(by_day=by_day, by_hour=by_hour)


# Price ranges for grouping
PRICE_RANGES = [
    (0, 10, "$0-10"),
    (10, 25, "$10-25"),
    (25, 50, "$25-50"),
    (50, 100, "$50-100"),
    (100, 250, "$100-250"),
    (250, float("inf"), "$250+"),
]

# Volume/shares ranges for grouping
VOLUME_RANGES = [
    (1, 100, "1-100"),
    (100, 500, "100-500"),
    (500, 1000, "500-1K"),
    (1000, 5000, "1K-5K"),
    (5000, float("inf"), "5K+"),
]


@router.get("/detailed/price-volume", response_model=PriceVolumeResponse)
async def price_volume_stats(
    db: DbSession,
    current_user: CurrentUser,
    ticker: Optional[str] = None,
    side: Optional[TradeSide] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    """Aggregated stats by entry price and volume/shares for charts."""

    q = select(Trade).where(Trade.user_id == current_user.id)
    if ticker:
        q = q.where(Trade.ticker == ticker.upper())
    if side:
        q = q.where(Trade.side == side)
    if start_date:
        q = q.where(Trade.date >= start_date)
    if end_date:
        q = q.where(Trade.date <= end_date)

    res = await db.execute(q)
    trades = res.scalars().all()

    if not trades:
        return PriceVolumeResponse(by_price=[], by_volume=[])

    # Initialize price range buckets
    price_data = {r[2]: {"pnl": 0.0, "trades": 0, "winners": 0, "losers": 0, "min": r[0], "max": r[1]}
                  for r in PRICE_RANGES}

    # Initialize volume range buckets
    volume_data = {r[2]: {"pnl": 0.0, "trades": 0, "winners": 0, "losers": 0, "min": r[0], "max": r[1]}
                   for r in VOLUME_RANGES}

    for t in trades:
        entry_price = float(t.entry_price)
        shares = int(t.shares)
        pnl = float(t.pnl)

        # Find price range
        for min_p, max_p, label in PRICE_RANGES:
            if min_p <= entry_price < max_p:
                price_data[label]["pnl"] += pnl
                price_data[label]["trades"] += 1
                if pnl > 0:
                    price_data[label]["winners"] += 1
                elif pnl < 0:
                    price_data[label]["losers"] += 1
                break

        # Find volume range
        for min_v, max_v, label in VOLUME_RANGES:
            if min_v <= shares < max_v:
                volume_data[label]["pnl"] += pnl
                volume_data[label]["trades"] += 1
                if pnl > 0:
                    volume_data[label]["winners"] += 1
                elif pnl < 0:
                    volume_data[label]["losers"] += 1
                break

    # Build response - only include ranges with trades
    by_price = []
    for min_p, max_p, label in PRICE_RANGES:
        d = price_data[label]
        if d["trades"] > 0:
            win_rate = _safe_div(d["winners"], d["trades"]) * 100
            by_price.append(PriceRangeStats(
                range_label=label,
                min_price=min_p,
                max_price=max_p if max_p != float("inf") else 999999,
                total_pnl=round(d["pnl"], 2),
                trades=d["trades"],
                winners=d["winners"],
                losers=d["losers"],
                win_rate=round(win_rate, 1),
            ))

    by_volume = []
    for min_v, max_v, label in VOLUME_RANGES:
        d = volume_data[label]
        if d["trades"] > 0:
            win_rate = _safe_div(d["winners"], d["trades"]) * 100
            by_volume.append(VolumeRangeStats(
                range_label=label,
                min_shares=min_v,
                max_shares=int(max_v) if max_v != float("inf") else 999999,
                total_pnl=round(d["pnl"], 2),
                trades=d["trades"],
                winners=d["winners"],
                losers=d["losers"],
                win_rate=round(win_rate, 1),
            ))

    return PriceVolumeResponse(by_price=by_price, by_volume=by_volume)
