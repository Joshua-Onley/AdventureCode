from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class AdventureProblemSubmission(Base):
    __tablename__ = "adventure_problem_submissions"
    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("adventure_attempts.id"), nullable=False)
    node_id = Column(String, nullable=False)
    code_submitted = Column(Text, nullable=False)
    output = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    attempt = relationship(
        "AdventureAttempt",
        back_populates="submissions",
        foreign_keys=[attempt_id]
    )

