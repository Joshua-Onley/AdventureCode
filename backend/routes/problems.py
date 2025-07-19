from fastapi import APIRouter, Depends, Form
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from services.problem_service import ProblemService
from schemas.problem import ProblemResponse, ProblemCreate
from dependencies import get_current_user
from models.user import User

router = APIRouter()

@router.post("/problems", response_model=dict)
async def create_problem(
    title: str = Form(...),
    description: str = Form(...),
    code_snippet: str = Form(...),
    expected_output: str = Form(...),
    language: str = Form(...),
    is_public: bool = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    problem_service = ProblemService(db)
    problem_data = ProblemCreate(
        title=title,
        description=description,
        code_snippet=code_snippet,
        expected_output=expected_output,
        language=language,
        is_public=is_public
    )
    
    problem = problem_service.create_problem(problem_data, current_user)
    
    return {
        "message": "Problem created successfully",
        "access_code": problem.access_code,
        "problem_id": problem.id
    }

@router.get("/problems", response_model=List[ProblemResponse])
async def get_user_problems(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    problem_service = ProblemService(db)
    return problem_service.get_user_problems(current_user)

@router.get("/problems/access/{access_code}", response_model=ProblemResponse)
async def get_problem_by_access_code(
    access_code: str,
    db: Session = Depends(get_db)
):
    problem_service = ProblemService(db)
    return problem_service.get_problem_by_access_code(access_code)

@router.delete("/problems/{problem_id}")
async def delete_problem(
    problem_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    problem_service = ProblemService(db)
    problem_service.delete_problem(problem_id, current_user)
    return {"message": "Problem deleted successfully"}

