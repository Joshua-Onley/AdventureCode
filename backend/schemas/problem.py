from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProblemBase(BaseModel):
    title: str
    description: str
    code_snippet: str
    expected_output: str
    language: str
    is_public: bool = False

class ProblemCreate(ProblemBase):
    pass

class ProblemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    code_snippet: Optional[str] = None
    expected_output: Optional[str] = None
    language: Optional[str] = None
    is_public: Optional[bool] = None

class ProblemResponse(ProblemBase):
    id: int
    access_code: str
    completions: int
    creator_id: int
    created_at: datetime
    approval_status: str
    
    class Config:
        orm_mode = True