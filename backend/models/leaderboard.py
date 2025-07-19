from sqlalchemy import Column, Integer, ForeignKey, TIMESTAMP, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
from sqlalchemy.dialects.postgresql import INTERVAL

class Leaderboard(Base):
    __tablename__ = "leaderboard"
    id = Column(Integer, primary_key=True, index=True)
    adventure_id = Column(Integer, ForeignKey("adventures.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    completion_time = Column(INTERVAL, nullable=True)
    completed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    score = Column(Numeric(10, 2))
    
   
    adventure = relationship("Adventure", back_populates="leaderboard_entries")
    user = relationship("User", back_populates="leaderboard_entries")
