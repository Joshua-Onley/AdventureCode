from sqlalchemy import Text, UniqueConstraint, Column, Integer, String, Boolean, DateTime, ForeignKey, TIMESTAMP, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    is_admin = Column(Boolean, default=False)
    name = Column(String)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, nullable=True)
    password_hash = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_adventures = relationship("Adventure", back_populates="creator", foreign_keys="Adventure.creator_id")
    attempts = relationship("AdventureAttempt", back_populates="user", foreign_keys="AdventureAttempt.user_id")
    leaderboard_entries = relationship("Leaderboard", back_populates="user", foreign_keys="Leaderboard.user_id")
    problems = relationship("Problem", back_populates="creator", foreign_keys="Problem.creator_id")
    achievements = relationship("UserAchievement", back_populates="user")
    badges = relationship("UserBadge", back_populates="user")
    adventures_approved = relationship("Adventure", back_populates="approved", foreign_keys="Adventure.approved_by")
    problems_approved = relationship("Problem", back_populates="approved", foreign_keys="Problem.approved_by")

# the models below are currently unused - they will be integrated in the future.
class UserAchievement(Base):
    __tablename__ = "user_achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    adventure_id = Column(Integer, ForeignKey("adventures.id"), nullable=True)
    achievement_type = Column(String(50), nullable=False)
    unlocked_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    metric_value = Column(Numeric(10, 2), nullable=True)
    
    user = relationship("User", back_populates="achievements")

class Badge(Base):
    __tablename__ = "badges"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True)
    description = Column(Text)
    icon_path = Column(String(255))
    
    earned_by = relationship("UserBadge", back_populates="badge")

class UserBadge(Base):
    __tablename__ = "user_badges"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    badge_id = Column(Integer, ForeignKey("badges.id"))
    earned_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    adventure_id = Column(Integer, ForeignKey("adventures.id"), nullable=True)
    
    user = relationship("User", back_populates="badges")
    badge = relationship("Badge", back_populates="earned_by")
    
    __table_args__ = (UniqueConstraint('user_id', 'badge_id', 'adventure_id', name='_user_badge_adventure_uc'),)