from datetime import datetime, timedelta
from pydantic import BaseModel, UUID4
from typing import List, Optional, Dict, Any
import uuid
from enum import Enum

class UserBase(BaseModel):
    name: str
    username: str
    email: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

class ProblemBase(BaseModel):
    title: str
    description: str
    code_snippet: str
    expected_output: str
    language: str
    is_public: bool = False

class ProblemCreate(ProblemBase):
    pass

class Problem(ProblemBase):
    id: int
    access_code: str
    creator_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class NodeData(BaseModel):
    id: UUID4
    position: Dict[str, float]
    data: ProblemBase
    type: Optional[str] = None

class EdgeData(BaseModel):
    id: str
    source: UUID4
    target: UUID4
    data: Dict[str, Any] = {}
    type: Optional[str] = None

class GraphData(BaseModel):
    nodes: List[NodeData]
    edges: List[EdgeData]

class AdventureBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False
    request_public: bool = False  

class AdventureCreate(AdventureBase):
    problems: List[ProblemCreate]
    graph_data: GraphData

class Adventure(AdventureBase):
    id: int
    creator_id: int
    total_attempts: int
    total_completions: int
    avg_completion_time: Optional[timedelta] = None
    best_completion_time: Optional[timedelta] = None
    approval_status: str = "draft"
    approval_requested_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    approved_by: Optional[int] = None
    access_code: Optional[str] = None
    access_code_expires_at: Optional[datetime] = None
    created_at: datetime
    start_node_id: str
    end_node_id: str



    class Config:
        orm_mode = True

class AdventureAttemptBase(BaseModel):
    current_node_id: UUID4
    outcome: Optional[str] = None

class AdventureAttemptCreate(AdventureAttemptBase):
    start_node_id: UUID4

class AdventureAttempt(AdventureAttemptBase):
    id: int
    adventure_id: int
    user_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    completed: bool = False
    path_taken: List[Dict[str, Any]] = []
    duration: Optional[timedelta] = None

    class Config:
        orm_mode = True

class AdventureStats(BaseModel):
    node_id: UUID4
    attempts: int
    successes: int
    avg_time: Optional[timedelta] = None

class AdventureApprove(BaseModel):
    status: str 
    reason: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class AdventureSummary(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    creator_id: int
    total_attempts: int
    total_completions: int
    approval_status: str
    
    class Config:
        orm_mode = True

class NodeStatus(str, Enum):
    started = "started"
    correct = "correct"
    incorrect = "incorrect"
    completed = "completed"

class AdventureProgress(BaseModel):
    current_node_id: UUID4
    outcome: NodeStatus