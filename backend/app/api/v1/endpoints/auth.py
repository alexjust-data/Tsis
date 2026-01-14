from datetime import timedelta
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from typing import Annotated

from app.api.deps import DbSession, CurrentUser
from app.core.config import get_settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.models.risk_settings import RiskSettings
from app.schemas.user import UserCreate, UserResponse, Token

router = APIRouter()
settings = get_settings()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: DbSession):
    """Register a new user"""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user
    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        name=user_data.name
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Create default risk settings for user
    risk_settings = RiskSettings(user_id=user.id)
    db.add(risk_settings)
    await db.commit()

    return user


@router.post("/login", response_model=Token)
async def login(
    db: DbSession,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
):
    """Login and get access token"""
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(subject=user.id, expires_delta=access_token_expires)

    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: CurrentUser):
    """Get current user info"""
    return current_user
