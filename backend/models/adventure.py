from sqlalchemy import Boolean, TIMESTAMP, Index, Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
from sqlalchemy.dialects.postgresql import UUID, INTERVAL, JSONB


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
