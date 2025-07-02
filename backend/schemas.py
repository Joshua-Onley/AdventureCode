from pydantic import BaseModel
from typing import List, Literal

class ProblemData(BaseModel):
    id: str
    title: str
    description: str
    language: str
    code_snippet: str
    expected_output: str
    difficulty: int

class NodePosition(BaseModel):
    id: str
    position: dict 

class EdgeDef(BaseModel):
    source: str
    target: str
    condition: str

class GraphData(BaseModel):
    nodes: List[NodePosition]
    edges: List[EdgeDef]


class AdventureBase(BaseModel):
    title: str
    description: str

class AdventureCreate(AdventureBase):
    problems: List[ProblemData]
    graph_data: GraphData

class AdventureResponse(AdventureBase):
    id: int
    creator_id: int
    problems: List[ProblemData]
    graph_data: GraphData

class AdventureList(BaseModel):
    id: int
    title: str
    description: str
    creator_id: int