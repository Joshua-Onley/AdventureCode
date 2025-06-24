from fastapi import FastAPI, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from database import engine, get_db
from models import Base, User, Problem, Adventure, Submission
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

Base.metadata.create_all(bind=engine)

#test

app = FastAPI()

origins = [
    "https://victorious-bay-07769b703.1.azurestaticapps.net",
    "http://localhost:5173",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
async def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"msg": "Login successful", "user": {"id": user.id, "email": user.email}}


@app.get("/users")
async def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return {"users": users}

@app.post("/problems")
async def create_problem(
    title: str = Form(...),
    description: str = Form(...),
    expected_output: str = Form(...),
    difficulty: int = Form(1),
    adventure_id: int = Form(None),
    db: Session = Depends(get_db)
):
    problem = Problem(
        title=title,
        description=description,
        expected_output=expected_output,
        difficulty=difficulty,
        adventure_id=adventure_id,
    )
    db.add(problem)
    db.commit()
    db.refresh(problem)
    return {"problem": problem}

@app.get("/problems")
async def list_problems(db: Session = Depends(get_db)):
    problems = db.query(Problem).all()
    return {"problems": problems}

@app.post("/adventures")
async def create_adventure(
    name: str = Form(...),
    description: str = Form(...),
    db: Session = Depends(get_db)
):
    adventure = Adventure(name=name, description=description)
    db.add(adventure)
    db.commit()
    db.refresh(adventure)
    return {"adventure": adventure}

@app.get("/adventures")
async def list_adventures(db: Session = Depends(get_db)):
    adventures = db.query(Adventure).all()
    return {"adventures": adventures}

@app.post("/submissions")
async def submit_solution(
    user_id: int = Form(...),
    problem_id: int = Form(...),
    submitted_code: str = Form(...),
    db: Session = Depends(get_db)
):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    output = "FAKE_OUTPUT"  

    is_correct = (output.strip() == problem.expected_output.strip())

    submission = Submission(
        user_id=user_id,
        problem_id=problem_id,
        submitted_code=submitted_code,
        output=output,
        is_correct=is_correct,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return {"submission": submission, "is_correct": is_correct}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
