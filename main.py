from fastapi import FastAPI, Request, Form
from pydantic import BaseModel
from typing import Union
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
import uuid
from run_in_docker import run_code_in_docker


app = FastAPI()
templates = Jinja2Templates(directory="templates")

problems = {}

@app.get("/", response_class=HTMLResponse)
async def landing(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Students functionality 

@app.get("/student", response_class=HTMLResponse)
async def student_get(request: Request): 
    return templates.TemplateResponse("student.html", {"request": request})


@app.post("/student", response_class=HTMLResponse)
async def student_post(request: Request, access_code: str = Form(...)):
    problem = problems.get(access_code.strip())
    if not problem:
        return templates.TemplateResponse("student.html", {"request": request, "error": "invalid access code"})
    return templates.TemplateResponse("student.html", {

        "request": request,
        "problem": problem,
        "access_code": access_code
    })

@app.post("/submit", response_class=HTMLResponse)
async def submit_code(request: Request, access_code: str = Form(...), student_code: str = Form(...)):
    problem = problems.get(access_code.strip())
    if not problem:
        return templates.TemplateResponse("student.html", {"request": request, "error": "invalid access code"})
    output = run_code_in_docker(student_code)
    expected = problem["expected_output"].strip()
    success = output.strip() == expected

    return templates.TemplateResponse("student.html", {
        "request": request,
        "problem": problem,
        "access_code": access_code,
        "student_code": student_code,
        "output": output, 
        "success": success,
        
    })

# teacher functionality

@app.get("/teacher", response_class=HTMLResponse)
async def teacher_get(request: Request):
    return templates.TemplateResponse("teacher.html", {"request": request})

@app.post("/teacher", response_class=HTMLResponse)
async def teacher_post(request: Request, description: str = Form(...), incomplete_code: str = Form(...), expected_output: str = Form(...)):
    code = str(uuid.uuid4())[:6]
    problems[code] = {
        "description": description,
        "incomplete_code": incomplete_code,
        "expected_output": expected_output

    }
    return templates.TemplateResponse("teacher.html", {"request": request, "code": code})



