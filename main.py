from fastapi import FastAPI, Request, Form, HTTPException
from pydantic import BaseModel
from typing import Union
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

import uuid
from run_in_docker import run_code_in_docker

# structure for coding problem submitted by the teacher
class ProblemCreate(BaseModel):
    description: str
    incomplete_code: str
    expected_output: str

# Structure for a student's code submission
class StudentSubmission(BaseModel):
    access_code: str 
    student_code: str


app = FastAPI()
templates = Jinja2Templates(directory="templates")

# dictionary to store all coding problems in memory. This uses a 6-digit code as the key
problems = {}

# page listing all problems
@app.get("/problems", response_class=HTMLResponse)
async def show_problems(request: Request):
    return templates.TemplateResponse("problems.html", {
        "request": request,
        "problems": problems
    })

# landing page
@app.get("/", response_class=HTMLResponse)
async def landing(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# /student shows a form where students can enter a problem access code
@app.get("/student", response_class=HTMLResponse)
async def student_get(request: Request): 
    return templates.TemplateResponse("student.html", {"request": request})

# if a student enters a valid access code, the corresponding problem will be loaded
@app.post("/student", response_class=HTMLResponse)
async def student_post(request: Request, access_code: str = Form(...)):
    problem = problems.get(access_code.strip())
    if not problem:
        raise HTTPException(status_code=404,detail="Invalid access code")
    return templates.TemplateResponse("student.html", {

        "request": request,
        "problem": problem,
        "access_code": access_code
    })

# when a student submits code, the form data is wrapped into a StudentSubmission object
# the student code is executed in a docker container
# if the student code outputs the expected output, the success flag is set to true
@app.post("/submit", response_class=HTMLResponse)
async def submit_code(
    request: Request,
    access_code: str = Form(...),
    student_code: str = Form(...)
):
    submission = StudentSubmission(access_code=access_code, student_code=student_code)
    problem = problems.get(submission.access_code.strip())
    if not problem:
        return templates.TemplateResponse("student.html", {
            "request": request,
            "error": "invalid access code"
        })
    
    output = run_code_in_docker(submission.student_code)
    expected = problem["expected_output"].strip()
    success = output.strip() == expected

    return templates.TemplateResponse("student.html", {
        "request": request,
        "problem": problem,
        "access_code": submission.access_code,
        "student_code": submission.student_code,
        "output": output,
        "success": success,
    })



# when a user visits the /teacher route, they can create a problem via a form
@app.get("/teacher", response_class=HTMLResponse)
async def teacher_get(request: Request):
    return templates.TemplateResponse("teacher.html", {"request": request})

# teacher submits the form to create a problem
@app.post("/teacher", response_class=HTMLResponse)
async def teacher_post(
    request: Request,
    description: str = Form(...),
    incomplete_code: str = Form(...),
    expected_output: str = Form(...)
):
    problem = ProblemCreate(
        description=description,
        incomplete_code=incomplete_code,
        expected_output=expected_output
        )
    
    code = str(uuid.uuid4())[:6]
    problems[code] = problem.dict() 

    return templates.TemplateResponse("teacher.html", {"request": request, "code": code})
