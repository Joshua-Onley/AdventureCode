from fastapi import APIRouter, Depends, Form, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional, List
import logging

from database import get_db
from models.user import User
from schemas.adventure import Adventure, AdventureCreate, AdventureUpdate, AdventureAttempt, AdventureProgress
from services.adventure_service import AdventureService
from services.code_execution_service import CodeExecutionService
from dependencies import get_current_user
from exceptions import NotFoundError, ValidationError, AuthorisationError

router = APIRouter(prefix="/adventures", tags=["adventures"])
logger = logging.getLogger("uvicorn.error")


def get_adventure_service(db: Session = Depends(get_db)) -> AdventureService:
    return AdventureService(db)


def get_code_execution_service() -> CodeExecutionService:
    return CodeExecutionService()


@router.post("/", response_model=Adventure, status_code=status.HTTP_201_CREATED)
async def create_adventure(
    adventure: AdventureCreate,
    current_user: User = Depends(get_current_user),
    adventure_service: AdventureService = Depends(get_adventure_service)
):
    
    try:
        return adventure_service.create_adventure(adventure, current_user)
    except ValidationError as e:
        return JSONResponse(
            status_code=400,
            content={"error": "Validation failed", "detail": str(e)}
        )
    except Exception as e:
        logger.error(f"Error creating adventure: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "detail": str(e)}
        )


@router.get("/public")
async def fetch_public_adventures(
    adventure_service: AdventureService = Depends(get_adventure_service)
):
   
    try:
        adventures = adventure_service.get_public_adventures()
        return {"adventures": adventures}
    except Exception as e:
        logger.error(f"Error fetching public adventures: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "detail": str(e)}
        )


@router.get("/access/{access_code}")
def get_adventure_by_code(
    access_code: str,
    adventure_service: AdventureService = Depends(get_adventure_service)
):
    try:
        return adventure_service.get_adventure_by_access_code(access_code)
    except NotFoundError:
        return JSONResponse(
            status_code=404,
            content={"error": "Adventure not found"}
        )
    except Exception as e:
        logger.error(f"Error getting adventure by access code: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "detail": str(e)}
        )


@router.get("/", response_model=List[Adventure])
async def list_user_adventures(
    current_user: User = Depends(get_current_user),
    adventure_service: AdventureService = Depends(get_adventure_service)
):
    
    try:
        return adventure_service.get_user_adventures(current_user)
    except Exception as e:
        logger.error(f"Error listing user adventures: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "detail": str(e)}
        )


@router.get("/{adventure_id}")
def view_adventure(
    adventure_id: int,
    adventure_service: AdventureService = Depends(get_adventure_service)
):
   
    try:
        return adventure_service.get_adventure_by_id(adventure_id)
    except NotFoundError:
        return JSONResponse(
            status_code=404,
            content={"error": "Adventure not found"}
        )
    except Exception as e:
        logger.error(f"Error viewing adventure: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "detail": str(e)}
        )


@router.put("/{adventure_id}", response_model=Adventure)
async def update_adventure(
    adventure_id: int,
    adventure_update: AdventureUpdate,
    current_user: User = Depends(get_current_user),
    adventure_service: AdventureService = Depends(get_adventure_service)
):

    try:
        return adventure_service.update_adventure(adventure_id, adventure_update, current_user)
    except NotFoundError:
        return JSONResponse(
            status_code=404,
            content={"error": "Adventure not found"}
        )
    except AuthorisationError as e:
        return JSONResponse(
            status_code=403,
            content={"error": "Forbidden", "detail": str(e)}
        )
    except Exception as e:
        logger.error(f"Error updating adventure: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "detail": str(e)}
        )


@router.delete("/{adventure_id}")
async def delete_adventure(
    adventure_id: int,
    current_user: User = Depends(get_current_user),
    adventure_service: AdventureService = Depends(get_adventure_service)
):

    try:
        adventure_service.delete_adventure(adventure_id, current_user)
        return {"message": "Adventure deleted successfully"}
    except NotFoundError:
        return JSONResponse(
            status_code=404,
            content={"error": "Adventure not found"}
        )
    except AuthorisationError as e:
        return JSONResponse(
            status_code=403,
            content={"error": "Forbidden", "detail": str(e)}
        )
    except Exception as e:
        logger.error(f"Error deleting adventure: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "detail": str(e)}
        )


@router.get("/{adventure_id}/attempt", response_model=AdventureAttempt)
async def get_or_start_adventure_attempt(
    adventure_id: int,
    current_user: User = Depends(get_current_user),
    adventure_service: AdventureService = Depends(get_adventure_service)
):
    
    try:
        return adventure_service.get_or_start_adventure_attempt(adventure_id, current_user)
    except NotFoundError:
        return JSONResponse(
            status_code=404,
            content={"error": "Adventure not found"}
        )
    except Exception as e:
        logger.error(f"Error getting/starting adventure attempt: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "detail": str(e)}
        )


@router.get("/attempts", response_model=List[AdventureAttempt])
async def get_user_attempts(
    adventure_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    adventure_service: AdventureService = Depends(get_adventure_service)
):
    
    try:
        return adventure_service.get_user_attempts(current_user, adventure_id)
    except Exception as e:
        logger.error(f"Error getting user attempts: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "detail": str(e)}
        )


@router.patch("/attempts/{attempt_id}/progress", response_model=AdventureAttempt)
async def update_attempt_progress(
    attempt_id: int,
    progress: AdventureProgress,
    current_user: User = Depends(get_current_user),
    adventure_service: AdventureService = Depends(get_adventure_service)
):
   
    try:
        return adventure_service.update_attempt_progress(attempt_id, progress, current_user)
    except NotFoundError:
        return JSONResponse(
            status_code=404,
            content={"error": "Attempt not found"}
        )
    except Exception as e:
        logger.error(f"Error updating attempt progress: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "detail": str(e)}
        )


@router.post("/submissions")
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
        
        attempt = adventure_service.get_user_attempts(current_user, None)
        attempt = next((a for a in attempt if a.id == attempt_id), None)
        
        if not attempt:
            return JSONResponse(
                status_code=404,
                content={"error": "Adventure attempt not found"}
            )
        
        
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
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "detail": str(e)}
        )