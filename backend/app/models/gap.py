from sqlalchemy import Column, String, Date, Float, BigInteger, Time, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql.schema import ForeignKey
from app.core.database import Base

class Gap(Base):
    __tablename__ = "gaps"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False, index=True)
    ticker = Column(String, ForeignKey("companies.ticker"), nullable=False, index=True)

    # Gap Metrics
    gap_value = Column(Float, nullable=False) # % Gap
    gap_direction = Column(String) # up/down
    
    # Price Action
    open_price = Column(Float)
    high_price = Column(Float)
    low_price = Column(Float)
    close_price = Column(Float)
    prev_close = Column(Float)
    
    volume = Column(BigInteger)
    
    # Intraday Stats
    high_spike = Column(Float) # % from open to high
    low_spike = Column(Float) # % from open to low
    return_pct = Column(Float) # % from open to close
    range_pct = Column(Float) # % range
    
    # Premarket
    pm_volume = Column(BigInteger, nullable=True)
    pm_high = Column(Float, nullable=True)
    pm_low = Column(Float, nullable=True)

    # Metadata
    catalyst_type = Column(String, nullable=True) # earnings, news, etc
    has_news = Column(Boolean, default=False)
    
    # Constraints
    __table_args__ = (UniqueConstraint('ticker', 'date', name='uq_gap_ticker_date'),)
    
    # Relationships
    company = relationship("Company", backref="gaps")
