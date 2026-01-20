from sqlalchemy import Column, String, Date, Boolean, JSON, BigInteger
from app.core.database import Base

class Company(Base):
    __tablename__ = "companies"

    ticker = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=True)
    cik = Column(String, nullable=True)
    
    sector = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    
    listing_date = Column(Date, nullable=True)
    delisting_date = Column(Date, nullable=True)
    
    status = Column(String, default="active")  # active, delisted, bankrupt
    is_active = Column(Boolean, default=True)
    
    exchange = Column(String, nullable=True)
    
    # Store history of name changes or symbol changes if needed
    meta_data = Column(JSON, nullable=True)
