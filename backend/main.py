from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException, Form, Request, status
from fastapi.responses import JSONResponse
import logging
import traceback
import schemas
from jose import JWTError
from sqlalchemy.orm import Session
from database import engine, get_db
import models
from passlib.context import CryptContext
from datetime import datetime, timedelta
from auth import hash_password, verify_password, create_access_token, decode_access_token
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import uuid
import httpx 
from datetime import timezone
from typing import Optional

app = FastAPI()

origins = [
    "https://victorious-bay-07769b703.1.azurestaticapps.net",
    "https://adventurecode-bcekcrhpauffhzbn.uksouth-01.azurewebsites.net",
    "http://localhost:5173",
    "http://127.0.0.1:8000"  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def all_exception_handler(request: Request, exc: Exception):
    logging.getLogger("uvicorn.error").error("Unhandled exception", exc_info=exc)
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )

logger = logging.getLogger("uvicorn.error")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
models.Base.metadata.create_all(bind=engine)

PISTON_URL = "https://emkc.org/api/v2/piston/execute"

version_map = {
    "python": "3.10.0",       
    "javascript": "18.15.0",  
    "typescript": "1.32.3",  
    "java": "15.0.2",         
    "c": "10.2.0",       
    "cpp": "10.2.0",        
    "ruby": "3.0.1",
    "go": "1.16.2",
    "php": "8.2.3",
    "swift": "5.8.1",         
    "rust": "1.68.2",
    "bash": "5.2.0",
    "kotlin": "1.8.20",
}

def get_extension(language: str) -> str:
    mapping = {
        "python": "py",
        "python2": "py",
        "python3": "py",
        "javascript": "js",
        "typescript": "ts",
        "java": "java",
        "c": "c",
        "cpp": "cpp",
        "ruby": "rb",
        "go": "go",
        "php": "php",
        "swift": "swift",
        "rust": "rs",
        "bash": "sh",
        "kotlin": "kt",
    }
    return mapping.get(language.lower(), "")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        username = decode_access_token(token)
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user = db.query(models.User).filter(models.User.username == username).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except JWTError as e:  
        raise HTTPException(status_code=401, detail="Token validation failed")
    
def generate_access_code(db: Session) -> str:
    while True:
        code = uuid.uuid4().hex[:6]
        if not db.query(models.Problem).filter(models.Problem.access_code == code).first():
            return code

@app.get("/")
async def read_root():
    return {"message": "API root"}

@app.post("/signup")
async def signup(
    name: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    if db.query(models.User).filter(models.User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_pw = hash_password(password)
    user = models.User(name=name, username=username, password_hash=hashed_pw)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"msg": "Account created", "user": {"id": user.id, "username": user.username}}

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": user.username})
    
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": user.id, "username": user.username}}

@app.get("/me")
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "name": current_user.name
    }

@app.get("/users")
async def list_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return {"users": users}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/problems")
async def create_problem(
    title: str = Form(...),
    description: str = Form(...),
    code_snippet: str = Form(...),
    expected_output: str = Form(...),
    language: str = Form(...),
    is_public: bool = Form(...),
    
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    access_code = generate_access_code(db)

    new_problem = models.Problem(
        access_code=access_code,
        title=title,
        description=description,
        code_snippet=code_snippet,
        expected_output=expected_output,
        language=language,
        is_public=is_public,
        completions  = 0,
        creator_id=current_user.id,
        approval_requested_at=datetime.now(timezone.utc) if is_public else None
    )

    db.add(new_problem)
    db.commit()
    db.refresh(new_problem)

    return {
        "message": "Problem created successfully",
        "access_code": access_code,
        "problem_id": new_problem.id
    }

@app.get("/problems/")
async def get_user_problems(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    problems = db.query(models.Problem).filter(
        models.Problem.creator_id == current_user.id
    ).all()
    
    return problems

@app.delete("/problems/{problem_id}")
async def delete_problem(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    problem = db.query(models.Problem).filter(models.Problem.id == problem_id).first()
    
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    

    if problem.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this problem"
        )
    
    db.delete(problem)
    db.commit()
    
    return {"message": "Problem deleted successfully"}

@app.post("/submissions")
async def submit_solution(
    access_code: str = Form(...),
    code: str = Form(...),
    language: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        
        problem = db.query(models.Problem).filter(models.Problem.access_code == access_code.lower()).first()
        if not problem:
            return JSONResponse(status_code=404, content={"error": "Problem not found"})

        lang = language.lower()
        version = version_map.get(lang)
        if not version:
            return JSONResponse(status_code=400, content={"error": "Unsupported language or missing version"})

        ext = get_extension(lang)
        if not ext:
            return JSONResponse(status_code=400, content={"error": "Unsupported language extension"})

        payload = {
            "language": lang,
            "version": version,
            "files": [{"name": f"Main.{ext}", "content": code}]
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(PISTON_URL, json=payload)

        if response.status_code != 200:
            return JSONResponse(status_code=500, content={"error": "Piston API failed", "details": response.text})

        result = response.json()
        run_result = result.get("run", {})

        user_output = run_result.get("output", "").strip()
        expected_output = problem.expected_output.strip()

        is_correct = False
       
        if user_output == expected_output:
            message = "Correct! Well done."
            is_correct = True
            problem.completions = (problem.completions or 0) + 1
            db.commit()
            db.refresh(problem)
        else:
            message = f"Incorrect. Expected output:\n{expected_output}\n\nYour output:\n{user_output}"

    
        return {
            "message": message,
            "output": user_output,
            "stdout": run_result.get("stdout"),
            "stderr": run_result.get("stderr"),
            "ran": bool(run_result),
            "language": lang,
            "is_correct": is_correct
        }

    except Exception as e:
        logger.error(f"Error in /submissions: {e}")
        logger.error(traceback.format_exc())
        return JSONResponse(status_code=500, content={"error": "Internal server error", "details": str(e)})
    
@app.get("/problems/access/{access_code}")
def get_problem_by_access_code(access_code: str, db: Session = Depends(get_db)):
    problem = db.query(models.Problem).filter(models.Problem.access_code == access_code).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem

@app.post("/adventures/", response_model=schemas.Adventure)
async def create_adventure(
    adventure: schemas.AdventureCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
  
    nodes = []
    for node in adventure.graph_data.nodes:
        node_id = str(node.id) if isinstance(node.id, uuid.UUID) else node.id
        nodes.append({
            "id": node_id,
            "position": node.position,
            "data": node.data.dict(),
            "type": node.type
        })
    
    edges = []
    for edge in adventure.graph_data.edges:
        edge_id = str(edge.id) if isinstance(edge.id, uuid.UUID) else edge.id
        source = str(edge.source) if isinstance(edge.source, uuid.UUID) else edge.source
        target = str(edge.target) if isinstance(edge.target, uuid.UUID) else edge.target
        edges.append({
            "id": edge_id,
            "source": source,
            "target": target,
            "data": edge.data,
            "type": edge.type
        })

    start_node = None
    for node in nodes:
        if not any(edge["target"] == node["id"] for edge in edges):
            start_node = node
            break
    
    end_node = None
    for node in nodes:
        if not any(edge["source"] == node["id"] for edge in edges):
            end_node = node
            break
    
    if not start_node or not end_node:
        raise HTTPException(
            status_code=400,
            detail="Adventure must have a clear start and end node"
        )

    approval_status = "draft"
    approval_requested_at = None
    if adventure.request_public:
        approval_status = "pending"
        approval_requested_at = datetime.now(timezone.utc)
    
    access_code = uuid.uuid4().hex[:6]

    db_adventure = models.Adventure(
        name=adventure.name,
        description=adventure.description,
        
        graph_data={
            "nodes": nodes,
            "edges": edges
        },
        creator_id=current_user.id,
        is_public=False,
        approval_status=approval_status,
        approval_requested_at=approval_requested_at,
        start_node_id=start_node["id"],
        end_node_id=end_node["id"],
        total_attempts=0,
        total_completions=0,
        access_code=access_code
    )
    
    db.add(db_adventure)
    db.commit()
    db.refresh(db_adventure)
    return db_adventure

@app.get("/adventures/public")
async def fetch_public_adventures(
    db: Session = Depends(get_db),
):
    public_adventures = db.query(models.Adventure).filter(
        models.Adventure.is_public == True,
        models.Adventure.approval_status == "approved"
    ).all()
    
    adventures_json = []
    for adventure in public_adventures:
        adventure_dict = {
            "id": adventure.id,
            "name": adventure.name,
            "description": adventure.description,
            "creator_id": adventure.creator_id,
            "created_at": adventure.created_at.isoformat() if adventure.created_at else None,
            "is_public": adventure.is_public,
            "approval_status": adventure.approval_status,
            "total_attempts": adventure.total_attempts,
            "total_completions": adventure.total_completions,
            "access_code": adventure.access_code,
            "start_node_id": adventure.start_node_id,
            "end_node_id": adventure.end_node_id,
            "best_completion_time": adventure.best_completion_time,
            "avg_completion_time": adventure.avg_completion_time,
            "best_completion_user": None
            
        }
        fastest = (
            db.query(models.Leaderboard, models.User.username)
            .join(models.User, models.Leaderboard.user_id == models.User.id)
            .filter(models.Leaderboard.adventure_id == adventure.id)
            .order_by(models.Leaderboard.completion_time.asc())
        .first())

        

        if fastest:
            
            entry, username = fastest
            adventure_dict["best_completion_time"] = entry.completion_time.total_seconds()
            adventure_dict["best_completion_user"] = username
        else:
            adventure_dict["best_completion_time"] = None
            adventure_dict["best_completion_user"] = None

        adventures_json.append(adventure_dict)
   
    
    return {"adventures": adventures_json}

@app.get("/adventures/access/{access_code}")
def get_adventure_by_code(
    access_code: str,
    db: Session = Depends(get_db),
):
    adventure = (
        db.query(models.Adventure)
          .filter(models.Adventure.access_code == access_code)
          .first()
    )
    if not adventure:
        raise HTTPException(status_code=404, detail="Adventure not found")
    return adventure

@app.get("/adventures/", response_model=list[schemas.Adventure])
async def list_user_adventures(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    adventures = db.query(models.Adventure).filter(models.Adventure.creator_id == current_user.id).all()
    return adventures

@app.get("/adventures/{adventure_id}")
def view_adventure(adventure_id: int, db: Session = Depends(get_db)):
    adventure = db.query(models.Adventure).filter(models.Adventure.id == adventure_id).first()
    if adventure is None:
        raise HTTPException(status_code=404, detail="Adventure not found")
    
    
    return adventure

@app.post(
    "/adventures/{adventure_id}/attempt",
    response_model=schemas.AdventureAttempt,
    status_code=status.HTTP_200_OK,
)
async def get_or_start_adventure_attempt(
    adventure_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    print("get_or_start_adventure_attempt")
    

    attempt = (
        db.query(models.AdventureAttempt)
        .filter(
            models.AdventureAttempt.adventure_id == adventure_id,
            models.AdventureAttempt.user_id == current_user.id,
            models.AdventureAttempt.completed == False,
        )
        .first()
    )
    if attempt:
        return attempt
    
    adventure = db.query(models.Adventure).filter_by(id=adventure_id).first()
    if not adventure:
        raise HTTPException(404, "Adventure not found")


    prior_completion = (
        db.query(models.AdventureAttempt)
        .filter(
            models.AdventureAttempt.adventure_id == adventure_id,
            models.AdventureAttempt.user_id == current_user.id,
            models.AdventureAttempt.completed == True,
        )
        .first()
    )

    attempt = models.AdventureAttempt(
        adventure_id=adventure_id,
        user_id=current_user.id,
        start_node_id=adventure.start_node_id,
        current_node_id=adventure.start_node_id,
        path_taken=[{
            "node_id": adventure.start_node_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": schemas.NodeStatus.started.value
        }],
        start_time=datetime.now(timezone.utc),
        completed=False,
    )
    db.add(attempt)
    
    if not prior_completion:
        adventure.total_attempts = (adventure.total_attempts or 0) + 1
    
    db.commit()
    db.refresh(attempt)
    return attempt

@app.get("/attempts", response_model=list[schemas.AdventureAttempt])
async def get_user_attempts(
    adventure_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.AdventureAttempt).filter(
        models.AdventureAttempt.user_id == current_user.id
    )
    
    if adventure_id is not None:
        query = query.filter(
            models.AdventureAttempt.adventure_id == adventure_id
        )
    
    attempts = query.all()
    return attempts

@app.patch(
    "/attempts/{attempt_id}/progress",
    response_model=schemas.AdventureAttempt,
    status_code=status.HTTP_200_OK,
)
async def update_attempt_progress(
    attempt_id: int,
    progress: schemas.AdventureProgress,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    attempt = (
        db.query(models.AdventureAttempt)
        .filter(
            models.AdventureAttempt.id == attempt_id,
            models.AdventureAttempt.user_id == current_user.id,
        )
        .first()
    )
  

    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")


    new_entry = {
        "node_id": str(progress.current_node_id),
        "outcome": progress.outcome.value,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "code": progress.code,
    }
    attempt.path_taken = attempt.path_taken or []
    attempt.path_taken.append(new_entry)
    attempt.current_node_id = str(progress.current_node_id)

  
    if getattr(progress, "completed", False):
        attempt.completed = True
        attempt.end_time = datetime.now(timezone.utc)


        if attempt.start_time:
            attempt.duration = attempt.end_time - attempt.start_time


        adventure = (
            db.query(models.Adventure)
            .filter(models.Adventure.id == attempt.adventure_id)
            .first()
        )
        if adventure:
         
            prior = (
                db.query(models.AdventureAttempt)
                .filter(
                    models.AdventureAttempt.adventure_id == adventure.id,
                    models.AdventureAttempt.user_id == current_user.id,
                    models.AdventureAttempt.completed == True,
                    models.AdventureAttempt.id != attempt_id,
                )
                .first()
            )
            if not prior:
                adventure.total_completions = (adventure.total_completions or 0) + 1

            if attempt.duration:
                if not adventure.best_completion_time or attempt.duration < adventure.best_completion_time:
                    adventure.best_completion_time = attempt.duration

                all_done = (
                    db.query(models.AdventureAttempt)
                    .filter(
                        models.AdventureAttempt.adventure_id == adventure.id,
                        models.AdventureAttempt.completed == True,
                    )
                    .all()
                )
                if all_done:
                    total_secs = sum(a.duration.total_seconds() for a in all_done if a.duration)
                    adventure.avg_completion_time = timedelta(seconds=total_secs / len(all_done))


        leaderboard_entry = models.Leaderboard(
            adventure_id=attempt.adventure_id,
            user_id=current_user.id,
            completion_time=attempt.duration,
            completed_at=attempt.end_time,
            score=attempt.duration.total_seconds(),  
        )
        db.add(leaderboard_entry)

    
    db.commit()
    db.refresh(attempt)
    return attempt


@app.put("/adventures/{adventure_id}", response_model=schemas.Adventure)
async def update_adventure(
    adventure_id: int,
    adventure_update: schemas.AdventureUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
   
    db_adventure = db.query(models.Adventure).filter(
        models.Adventure.id == adventure_id,
        models.Adventure.creator_id == current_user.id
    ).first()
    
    if not db_adventure:
        raise HTTPException(status_code=404, detail="Adventure not found")
    
  
    if adventure_update.name is not None:
        db_adventure.name = adventure_update.name
    if adventure_update.description is not None:
        db_adventure.description = adventure_update.description
    

    if adventure_update.graph_data is not None:
        nodes = []
        for node in adventure_update.graph_data.nodes:
            node_id = str(node.id) if isinstance(node.id, uuid.UUID) else node.id
            nodes.append({
                "id": node_id,
                "position": node.position,
                "data": node.data.dict(),
                "type": node.type
            })
        
        edges = []
        for edge in adventure_update.graph_data.edges:
            edge_id = str(edge.id) if isinstance(edge.id, uuid.UUID) else edge.id
            source = str(edge.source) if isinstance(edge.source, uuid.UUID) else edge.source
            target = str(edge.target) if isinstance(edge.target, uuid.UUID) else edge.target
            edges.append({
                "id": edge_id,
                "source": source,
                "target": target,
                "data": edge.data,
                "type": edge.type
            })
        
        db_adventure.graph_data = {
            "nodes": nodes,
            "edges": edges
        }
    
    db.commit()
    db.refresh(db_adventure)
    return db_adventure

@app.delete("/adventures/{adventure_id}")
async def delete_adventure(
    adventure_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    adventure = db.query(models.Adventure).filter(
        models.Adventure.id == adventure_id,
        models.Adventure.creator_id == current_user.id
    ).first()
    
    if not adventure:
        raise HTTPException(status_code=404, detail="Adventure not found")
    
  
    db.query(models.AdventureProblemSubmission).filter(
        models.AdventureProblemSubmission.attempt_id.in_(
            db.query(models.AdventureAttempt.id).filter(
                models.AdventureAttempt.adventure_id == adventure_id
            )
        )
    ).delete(synchronize_session=False)
    
    db.query(models.AdventureAttempt).filter(
        models.AdventureAttempt.adventure_id == adventure_id
    ).delete(synchronize_session=False)
    
    db.delete(adventure)
    db.commit()
    
    return {"message": "Adventure deleted successfully"}

@app.post("/adventure_submissions")
async def submit_adventure_problem(
    attempt_id: int = Form(...),
    node_id: str = Form(...),
    code: str = Form(...),
    language: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    ):
    
    attempt = db.query(models.AdventureAttempt).filter_by(id=attempt_id).first()
    if not attempt or attempt.user_id != current_user.id:
        raise HTTPException(404, "Adventure attempt not found")

    adventure = attempt.adventure
    node_entry = next(
        (n for n in adventure.graph_data["nodes"] if n["id"] == node_id),
        None
    )
    if not node_entry:
        raise HTTPException(404, "Node not found in this adventure")

    expected_output = node_entry["data"]["expected_output"].strip()

    lang = language.lower()
    version = version_map.get(lang)
    if not version:
        return JSONResponse(400, {"error": "Unsupported language"})
    ext = get_extension(lang)
    if not ext:
        return JSONResponse(400, {"error": "Unsupported language extension"})

    payload = {
        "language": lang,
        "version": version,
        "files": [{"name": f"Main.{ext}", "content": code}],
    }
    async with httpx.AsyncClient() as client:
        piston_res = await client.post(PISTON_URL, json=payload)
    if piston_res.status_code != 200:
        return JSONResponse(500, {"error": "Piston API failed"})
    run = piston_res.json().get("run", {})
    user_output = run.get("output", "").strip()

    is_correct = (user_output == expected_output)
    message = (
        "Correct! Well done."
        if is_correct
        else f"Incorrect. Expected:\n{expected_output}\n\nYour output:\n{user_output}"
    )

    submission = models.AdventureProblemSubmission(
        attempt_id=attempt_id,
        node_id=node_id,
        code_submitted=code,
        output=user_output,
        is_correct=is_correct,
        created_at=datetime.now(timezone.utc),
    )
    db.add(submission)

    entry = {
        "node_id": node_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "outcome": "correct" if is_correct else "incorrect",
    }
    if not attempt.path_taken:
        attempt.path_taken = []
    attempt.path_taken.append(entry)
    attempt.current_node_id = node_id

    db.commit()
    db.refresh(attempt)

    return {
        "message": message,
        "output": user_output,
        "stdout": run.get("stdout"),
        "stderr": run.get("stderr"),
        "is_correct": is_correct,
    }