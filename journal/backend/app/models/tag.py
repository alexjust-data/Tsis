from sqlalchemy import Column, Integer, String, ForeignKey, Table, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


# Association table for many-to-many relationship
trade_tags = Table(
    "trade_tags",
    Base.metadata,
    Column("trade_id", Integer, ForeignKey("trades.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(50), nullable=False)
    color = Column(String(7), default="#3B82F6")  # Hex color
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="tags")
    trades = relationship("Trade", secondary=trade_tags, back_populates="tags")
