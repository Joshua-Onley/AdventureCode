from jose import JWTError
from fastapi import FastAPI, Depends, HTTPException, Form, Security
from sqlalchemy.orm import Session
from database import engine, get_db
from models import Base, User, Problem
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from datetime import datetime, timedelta
from auth import hash_password, verify_password, create_access_token, decode_access_token
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import uuid
from pydantic import BaseModel
import httpx
from fastapi.responses import JSONResponse
import logging
import traceback

logger = logging.getLogger("uvicorn.error")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
Base.metadata.create_all(bind=engine)
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
        email = decode_access_token(token)
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user = db.query(User).filter(User.email == email).first()
        print(f"{user}")
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except JWTError as e:  
        raise HTTPException(status_code=401, detail="Token validation failed")
    
def generate_access_code(db: Session) -> str:
    while True:
        code = uuid.uuid4().hex[:6]
        if not db.query(Problem).filter(Problem.access_code == code).first():
            return code


@app.get("/")
async def read_root():
    return {"message": "API root"}

@app.post("/signup")
async def signup(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_pw = hash_password(password)
    user = User(name=name, email=email, password=hashed_pw)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"msg": "Account created", "user": {"id": user.id, "email": user.email}}

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": user.email})
    print(f"Generated token: {access_token}") 
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": user.id, "email": user.email}}

@app.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name
    }


@app.get("/users")
async def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
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
    current_user: User = Depends(get_current_user)
):
    access_code = generate_access_code(db)

    new_problem = Problem(
        access_code=access_code,
        title=title,
        description=description,
        code_snippet=code_snippet,
        expected_output=expected_output,
        language=language,
        is_public=is_public,
        creator_id=None if is_public else current_user.id
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

class Submission(BaseModel):
    access_code: str
    submitted_code: str

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
        
        problem = db.query(Problem).filter(Problem.access_code == access_code.lower()).first()
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
            response = await client.post("https://emkc.org/api/v2/piston/execute", json=payload)

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
    problem = db.query(Problem).filter(Problem.access_code == access_code).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem
