from pydantic import BaseModel, Field
from datetime import datetime


class TagCreate(BaseModel):
    name: str = Field(..., max_length=50)
    color: str = Field(default="#3B82F6", pattern=r"^#[0-9A-Fa-f]{6}$")


class TagResponse(BaseModel):
    id: int
    name: str
    color: str
    created_at: datetime

    class Config:
        from_attributes = True
