from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException, Form, Security, Request
from fastapi.responses import JSONResponse
import logging
import traceback
import schemas

app = FastAPI()

origins = [
    "https://victorious-bay-07769b703.1.azurestaticapps.net",
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
from sqlalchemy.orm import joinedload

from schemas import (
    AdventureCreate, 
    Adventure, 
    AdventureSummary, 
    AdventureProgress,
    AdventureApprove,
    AdventureAttempt,
    NodeStatus
)

logger = logging.getLogger("uvicorn.error")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
models.Base.metadata.create_all(bind=engine)

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
        print(f"{user}")
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
    print(f"Generated token: {access_token}") 
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
        creator_id=None if is_public else current_user.id,
        approval_requested_at=datetime.utcnow() if is_public else None
    )

    db.add(new_problem)
    db.commit()
    db.refresh(new_problem)

    return {
        "message": "Problem created successfully",
        "access_code": access_code,
        "problem_id": new_problem.id
    }

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

       
        if user_output == expected_output:
            message = "Correct! Well done."
        else:
            message = f"Incorrect. Expected output:\n{expected_output}\n\nYour output:\n{user_output}"

    
        return {
            "message": message,
            "output": user_output,
            "stdout": run_result.get("stdout"),
            "stderr": run_result.get("stderr"),
            "ran": bool(run_result),
            "language": lang,
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



@app.post("/adventures/", response_model=Adventure)
async def create_adventure(
    adventure: AdventureCreate,
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
        approval_requested_at = datetime.utcnow()
    
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
            
        }
        adventures_json.append(adventure_dict)
        print({"adventures": adventures_json})
    
    return {"adventures": adventures_json}


@app.post("/adventures/{adventure_id}/attempt", response_model=AdventureAttempt)
async def start_adventure_attempt(
    adventure_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    adventure = db.query(Adventure).filter(Adventure.id == adventure_id).first()
    if not adventure:
        raise HTTPException(status_code=404, detail="Adventure not found")
    

    attempt = AdventureAttempt(
        adventure_id=adventure_id,
        user_id=current_user.id,
        start_node_id=adventure.start_node_id,
        current_node_id=adventure.start_node_id,
        path_taken=[{
            "node_id": adventure.start_node_id,
            "timestamp": datetime.utcnow().isoformat(),
            "status": NodeStatus.started.value
        }],
        start_time=datetime.utcnow(),
        completed=False
    )
    
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    

    adventure.total_attempts = (adventure.total_attempts or 0) + 1
    db.commit()
    
    return attempt

@app.get("/adventures/", response_model=list[AdventureSummary])
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



@app.patch("/attempts/{attempt_id}/progress", response_model=AdventureAttempt)
async def update_attempt_progress(
    attempt_id: int,
    progress: AdventureProgress,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    attempt = db.query(AdventureAttempt).filter(
        AdventureAttempt.id == attempt_id,
        AdventureAttempt.user_id == current_user.id
    ).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    

    new_entry = {
        "node_id": str(progress.current_node_id),
        "outcome": progress.outcome.value,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    
    if not attempt.path_taken:
        attempt.path_taken = []
    
    attempt.path_taken.append(new_entry)
    attempt.current_node_id = str(progress.current_node_id)
    

    adventure = db.query(Adventure).filter(Adventure.id == attempt.adventure_id).first()
    if progress.current_node_id == uuid.UUID(adventure.end_node_id):
        attempt.completed = True
        attempt.end_time = datetime.utcnow()
        attempt.duration = attempt.end_time - attempt.start_time
        
      
        adventure.total_completions = (adventure.total_completions or 0) + 1
        
       
        if not adventure.best_completion_time or attempt.duration < adventure.best_completion_time:
            adventure.best_completion_time = attempt.duration
        
      
        total_seconds = (adventure.avg_completion_time or timedelta(0)).total_seconds() * (adventure.total_completions - 1)
        total_seconds += attempt.duration.total_seconds()
        adventure.avg_completion_time = timedelta(seconds=total_seconds / adventure.total_completions)
    
    db.commit()
    return attempt