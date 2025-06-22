import uuid
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    role = Column(String, default="student")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Adventure(Base):
    __tablename__ = "adventures"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Problem(Base):
    __tablename__ = "problems"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, index=True)
    description = Column(Text)
    expected_output = Column(Text)
    difficulty = Column(Integer, default=1)
    adventure_id = Column(UUID(as_uuid=True), ForeignKey("adventures.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    problem_id = Column(UUID(as_uuid=True), ForeignKey("problems.id"))
    submitted_code = Column(Text)
    output = Column(Text)
    is_correct = Column(Boolean)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
