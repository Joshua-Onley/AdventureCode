from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class Problem(Base):
    __tablename__ = "problems"
    id = Column(Integer, primary_key=True, index=True)
    access_code = Column(String(6), unique=True, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    code_snippet = Column(Text, nullable=False) 
    expected_output = Column(Text, nullable=False)  
    completions = Column(Integer, nullable = False)
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


