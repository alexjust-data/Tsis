from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.api.deps import DbSession, CurrentUser
from app.models.risk_settings import RiskSettings
from app.schemas.risk_settings import RiskSettingsResponse, RiskSettingsUpdate

router = APIRouter()


@router.get("/", response_model=RiskSettingsResponse)
async def get_risk_settings(db: DbSession, current_user: CurrentUser):
    """Get risk settings for current user"""
    result = await db.execute(
        select(RiskSettings).where(RiskSettings.user_id == current_user.id)
    )
    settings = result.scalar_one_or_none()

    if not settings:
        # Create default settings if not exist
        settings = RiskSettings(user_id=current_user.id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    return settings


@router.put("/", response_model=RiskSettingsResponse)
async def update_risk_settings(
    settings_data: RiskSettingsUpdate,
    db: DbSession,
    current_user: CurrentUser
):
    """Update risk settings"""
    result = await db.execute(
        select(RiskSettings).where(RiskSettings.user_id == current_user.id)
    )
    settings = result.scalar_one_or_none()

    if not settings:
        settings = RiskSettings(user_id=current_user.id)
        db.add(settings)

    update_data = settings_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)

    await db.commit()
    await db.refresh(settings)

    return settings


@router.get("/calculator")
async def calculate_position_size(
    db: DbSession,
    current_user: CurrentUser,
    entry_price: float,
    stop_price: float,
    risk_override: float | None = None,
):
    """Calculate position size based on risk settings"""
    result = await db.execute(
        select(RiskSettings).where(RiskSettings.user_id == current_user.id)
    )
    settings = result.scalar_one_or_none()

    if not settings:
        raise HTTPException(status_code=404, detail="Risk settings not found")

    # Calculate risk per share
    risk_per_share = abs(entry_price - stop_price)

    if risk_per_share == 0:
        raise HTTPException(status_code=400, detail="Entry and stop price cannot be the same")

    # Use override or default risk
    risk_amount = risk_override if risk_override else (settings.account_balance * settings.risk_per_trade_percent)

    # Calculate shares
    shares = int(risk_amount / risk_per_share)

    # Apply limits
    max_shares_by_position = int(settings.max_position / entry_price)
    max_shares_by_order = int(settings.max_order / entry_price)
    max_shares = min(shares, settings.max_shares_per_trade, max_shares_by_position, max_shares_by_order)

    # Calculate position value
    position_value = max_shares * entry_price
    actual_risk = max_shares * risk_per_share

    return {
        "recommended_shares": max_shares,
        "calculated_shares": shares,
        "position_value": round(position_value, 2),
        "risk_amount": round(actual_risk, 2),
        "risk_percent": round(actual_risk / settings.account_balance * 100, 2),
        "entry_price": entry_price,
        "stop_price": stop_price,
        "risk_per_share": round(risk_per_share, 4),
        "limits_applied": {
            "max_shares_per_trade": settings.max_shares_per_trade,
            "max_position": settings.max_position,
            "max_order": settings.max_order,
        }
    }
