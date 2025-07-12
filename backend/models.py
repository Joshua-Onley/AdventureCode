import uuid
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey, JSON, TIMESTAMP, UniqueConstraint, Index, Numeric
from sqlalchemy.dialects.postgresql import UUID, INTERVAL, JSONB
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

    created_adventures = relationship(
        "Adventure", 
        back_populates="creator",
        foreign_keys="Adventure.creator_id"
    )
    attempts = relationship(
        "AdventureAttempt", 
        back_populates="user",
        foreign_keys="AdventureAttempt.user_id"
    )
    achievements = relationship(
        "UserAchievement", 
        back_populates="user",
        foreign_keys="UserAchievement.user_id"
    )
    badges = relationship(
        "UserBadge", 
        back_populates="user",
        foreign_keys="UserBadge.user_id"
    )
    leaderboard_entries = relationship(
        "Leaderboard", 
        back_populates="user",
        foreign_keys="Leaderboard.user_id"
    )

    adventures_approved = relationship(
        "Adventure",
        back_populates="approved",
        foreign_keys="[Adventure.approved_by]"
    )

    problems_approved = relationship(
        "Problem",
        back_populates="approved",
        foreign_keys="[Problem.approved_by]"
    )
    
    problems = relationship(
        "Problem",
        back_populates="creator",
        foreign_keys="[Problem.creator_id]",   
    )

    

class Problem(Base):
    __tablename__ = "problems"
    id = Column(Integer, primary_key=True, index=True)
    access_code = Column(String(6), unique=True, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    code_snippet = Column(Text, nullable=False) 
    expected_output = Column(Text, nullable=False)  
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True)


    is_public = Column(Boolean, default=False)

    approval_status = Column(String(20), default="draft") 
    approval_requested_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)

    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    language = Column(String, nullable=False)

    creator = relationship(
        "User",
        back_populates="problems",
        foreign_keys=[creator_id],    
    )

    approved  = relationship(
        "User",
        foreign_keys=[approved_by],
        back_populates="problems_approved"
       )


class Adventure(Base):
    __tablename__ = "adventures"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    graph_data = Column(JSONB, nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    total_attempts = Column(Integer, default=0)
    total_completions = Column(Integer, default=0)
    avg_completion_time = Column(INTERVAL, nullable=True)
    best_completion_time = Column(INTERVAL, nullable=True)
    is_public = Column(Boolean, default=False)
    approval_status = Column(String(20), default="draft") 
    approval_requested_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    access_code = Column(String(6), unique=True, nullable=True)
    access_code_expires_at = Column(DateTime, nullable=True)

    start_node_id = Column(String, nullable=False)
    end_node_id = Column(String, nullable=False)

    
    creator = relationship(
        "User", 
        back_populates="created_adventures",
        foreign_keys=[creator_id]
    )
    attempts = relationship(
        "AdventureAttempt", 
        back_populates="adventure",
        foreign_keys="AdventureAttempt.adventure_id"
    )
    stats = relationship(
        "AdventureStats", 
        back_populates="adventure",
        foreign_keys="AdventureStats.adventure_id"
    )
    leaderboard_entries = relationship(
        "Leaderboard", 
        back_populates="adventure",
        foreign_keys="Leaderboard.adventure_id"
    )

    approved  = relationship(
        "User",
        foreign_keys=[approved_by],
        back_populates="adventures_approved"
)
    
    __table_args__ = (
        Index('ix_adventure_creator', 'creator_id'),
        Index('ix_adventure_approval', 'approval_status'),
    )


class AdventureAttempt(Base):
    __tablename__ = "adventure_attempts"
    id = Column(Integer, primary_key=True, index=True)
    adventure_id = Column(Integer, ForeignKey("adventures.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    start_time = Column(TIMESTAMP(timezone=True), server_default=func.now())
    end_time = Column(TIMESTAMP(timezone=True), nullable=True)
    completed = Column(Boolean, default=False)
    path_taken = Column(JSONB)
    current_node_id = Column(UUID(as_uuid=True), nullable=True)
    start_node_id = Column(UUID(as_uuid=True), nullable=False)
    duration = Column(INTERVAL, nullable=True)
    
    adventure = relationship(
        "Adventure", 
        back_populates="attempts",
        foreign_keys=[adventure_id]
    )
    user = relationship(
        "User", 
        back_populates="attempts",
        foreign_keys=[user_id]
    )
    
    __table_args__ = (
        Index('ix_attempt_user_adventure', 'user_id', 'adventure_id'),
        Index('ix_attempt_completion', 'completed', 'end_time'),
    )

    submissions = relationship(
        "AdventureProblemSubmission",
        back_populates="attempt",
        cascade="all, delete-orphan",
        foreign_keys="AdventureProblemSubmission.attempt_id"
    )

class AdventureProblemSubmission(Base):
    __tablename__ = "adventure_problem_submissions"
    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("adventure_attempts.id"), nullable=False)
    node_id    = Column(String, nullable=False)
    code_submitted = Column(Text, nullable=False)
    output         = Column(Text, nullable=False)
    is_correct     = Column(Boolean, nullable=False)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

    attempt = relationship(
        "AdventureAttempt",
        back_populates="submissions",
        foreign_keys=[attempt_id]
    )


class AdventureStats(Base):
    __tablename__ = "adventure_stats"
    id = Column(Integer, primary_key=True, index=True)
    adventure_id = Column(Integer, ForeignKey("adventures.id"))
    node_id = Column(UUID(as_uuid=True), nullable=False)
    attempts = Column(Integer, default=0)
    successes = Column(Integer, default=0)
    avg_time = Column(INTERVAL, nullable=True)
    
    adventure = relationship("Adventure", back_populates="stats")
   
    __table_args__ = (UniqueConstraint('adventure_id', 'node_id', name='_adventure_node_uc'),)

class UserAchievement(Base):
    __tablename__ = "user_achievements"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    adventure_id = Column(Integer, ForeignKey("adventures.id"), nullable=True)
    achievement_type = Column(String(50), nullable=False)
    unlocked_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    metric_value = Column(Numeric(10, 2), nullable=True)
    
    user = relationship("User", back_populates="achievements")

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

