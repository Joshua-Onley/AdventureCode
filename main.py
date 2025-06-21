from fastapi import FastAPI, Depends, HTTPException, Request, Form
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from database import engine, get_db
from models import Base, User, Problem, Adventure, Submission
import os


Base.metadata.create_all(bind=engine)

app = FastAPI()
templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/users")
async def create_user(name: str = Form(...), email: str = Form(...), role: str = Form("student"), db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(name=name, email=email, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"user": user}

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

@app.get("/users-form", response_class=HTMLResponse)
async def users_form(request: Request):
    return templates.TemplateResponse("users_form.html", {"request": request})

@app.get("/problems-form", response_class=HTMLResponse)
async def problems_form(request: Request):
    return templates.TemplateResponse("problems_form.html", {"request": request})

@app.get("/adventures-form", response_class=HTMLResponse)
async def adventures_form(request: Request):
    return templates.TemplateResponse("adventures_form.html", {"request": request})

@app.get("/submit-form", response_class=HTMLResponse)
async def submit_form(request: Request):
    return templates.TemplateResponse("submit_form.html", {"request": request})



@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
