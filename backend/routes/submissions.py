from fastapi import APIRouter, Depends, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import logging
import traceback

from database import get_db
from models.user import User
from services.code_execution_service import CodeExecutionService
from services.problem_service import ProblemService
from services.adventure_service import AdventureService
from dependencies import get_current_user
from exceptions import NotFoundError, ValidationError

router = APIRouter(tags=["submissions"])
logger = logging.getLogger("uvicorn.error")


def get_code_execution_service() -> CodeExecutionService:
    
    return CodeExecutionService()


def get_problem_service(db: Session = Depends(get_db)) -> ProblemService:
  
    return ProblemService(db)


def get_adventure_service(db: Session = Depends(get_db)) -> AdventureService:
    
    return AdventureService(db)


@router.post("/submissions")
async def submit_solution(
    access_code: str = Form(...),
    code: str = Form(...),
    language: str = Form(...),
    problem_service: ProblemService = Depends(get_problem_service),
    code_execution_service: CodeExecutionService = Depends(get_code_execution_service)
):
   
    try:
        
        problem = problem_service.get_problem_by_access_code(access_code.lower())
        
        
        run_result = await code_execution_service.execute_code(code, language)
        user_output = run_result.get("output", "").strip()
        expected_output = problem.expected_output.strip()

        
        is_correct = (user_output == expected_output)
        
        if is_correct:
            message = "Correct! Well done."
            print(f"submisssions.py problem {problem}")
            problem_service.increment_completions(problem)
        else:
            message = f"Incorrect. Expected output:\n{expected_output}\n\nYour output:\n{user_output}"

        return {
            "message": message,
            "output": user_output,
            "stdout": run_result.get("stdout"),
            "stderr": run_result.get("stderr"),
            "ran": bool(run_result),
            "language": language.lower(),
            "is_correct": is_correct
        }

    except NotFoundError:
        return JSONResponse(
            status_code=404,
            content={"error": "Problem not found"}
        )
    except ValidationError as e:
        return JSONResponse(
            status_code=400,
            content={"error": "Validation failed", "detail": str(e)}
        )
    except Exception as e:
        logger.error(f"Error in /submissions: {e}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "details": str(e)}
        )


@router.post("/adventure_submissions")
async def submit_adventure_problem(
    attempt_id: int = Form(...),
    node_id: str = Form(...),
    code: str = Form(...),
    language: str = Form(...),
    current_user: User = Depends(get_current_user),
    adventure_service: AdventureService = Depends(get_adventure_service),
    code_execution_service: CodeExecutionService = Depends(get_code_execution_service)
):

    try:
       
        attempt = adventure_service.get_attempt_by_id(attempt_id, current_user)
        
        
        adventure = adventure_service.get_adventure_by_id(attempt.adventure_id)
        node_entry = next(
            (n for n in adventure.graph_data["nodes"] if n["id"] == node_id),
            None
        )
        
        if not node_entry:
            return JSONResponse(
                status_code=404,
                content={"error": "Node not found in this adventure"}
            )
        
        expected_output = node_entry["data"]["expected_output"].strip()
        
        
        run_result = await code_execution_service.execute_code(code, language)
        user_output = run_result.get("output", "").strip()
        
        
        is_correct = (user_output == expected_output)
        message = (
            "Correct! Well done."
            if is_correct
            else f"Incorrect. Expected:\n{expected_output}\n\nYour output:\n{user_output}"
        )
        
     
        adventure_service.submit_adventure_problem(
            attempt_id, node_id, code, user_output, is_correct, current_user
        )
        
        return {
            "message": message,
            "output": user_output,
            "stdout": run_result.get("stdout"),
            "stderr": run_result.get("stderr"),
            "is_correct": is_correct,
        }
        
    except NotFoundError as e:
        return JSONResponse(
            status_code=404,
            content={"error": str(e)}
        )
    except ValidationError as e:
        return JSONResponse(
            status_code=400,
            content={"error": "Validation failed", "detail": str(e)}
        )
    except Exception as e:
        logger.error(f"Error in adventure submission: {e}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "detail": str(e)}
        )