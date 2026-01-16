from __future__ import annotations

from datetime import date
from math import sqrt
from typing import Optional

from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import DbSession, CurrentUser
from app.models.trade import Trade, TradeSide
from app.schemas.reports import DetailedStatsResponse

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
