import uuid
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)  
    created_at = Column(DateTime(timezone=True), server_default=func.now())


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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    language = Column(String, nullable=False)


class Adventure(Base):
    __tablename__ = "adventures"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    problems = Column(JSON, nullable=False)   
    graph_data = Column(JSON, nullable=False)  
    creator_id = Column(Integer, nullable=False) 