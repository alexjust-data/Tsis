from fastapi import APIRouter
from app.api.v1.endpoints import auth, trades, dashboard, tags, risk_settings, reports

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(trades.router, prefix="/trades", tags=["trades"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(tags.router, prefix="/tags", tags=["tags"])
api_router.include_router(risk_settings.router, prefix="/risk-settings", tags=["risk-settings"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
