from fastapi import FastAPI, Request, Form, HTTPException
from pydantic import BaseModel
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import uuid
from run_in_docker import run_code_in_docker
from dotenv import load_dotenv
import os
from supabase import create_client, Client

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

app = FastAPI()
templates = Jinja2Templates(directory="templates")

class ProblemCreate(BaseModel):
    description: str
    incomplete_code: str
    expected_output: str

class StudentSubmission(BaseModel):
    access_code: str
    student_code: str

@app.get("/problems", response_class=HTMLResponse)
async def show_problems(request: Request):
    try:
        response = supabase.from_("problems").select("*").execute()
        problems = response.data or []
        problems_dict = {p["code"]: p for p in problems}
        return templates.TemplateResponse("problems.html", {
            "request": request,
            "problems": problems_dict
        })
    except Exception as e:
        return templates.TemplateResponse("problems.html", {
            "request": request,
            "problems": {},
            "error": "Failed to load problems"
        })

@app.get("/", response_class=HTMLResponse)
async def landing(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/student", response_class=HTMLResponse)  
async def student_get(request: Request):
    return templates.TemplateResponse("student.html", {"request": request})

@app.post("/student", response_class=HTMLResponse)
async def student_post(request: Request, access_code: str = Form(...)):
    try:
        response = supabase.from_("problems").select("*").eq("code", access_code.strip()).execute()
        if not response.data:
            return templates.TemplateResponse("student.html", {
                "request": request,
                "error": "Invalid access code"
            })
        
        problem = response.data[0]
        return templates.TemplateResponse("student.html", {
            "request": request,
            "problem": problem,
            "access_code": access_code
        })
    except Exception as e:
        return templates.TemplateResponse("student.html", {
            "request": request,
            "error": "Database error. Please try again."
        })

@app.post("/submit", response_class=HTMLResponse)
async def submit_code(
    request: Request,
    access_code: str = Form(...),
    student_code: str = Form(...)
):
    try:
        # Fetch problem by code
        response = supabase.from_("problems").select("*").eq("code", access_code.strip()).execute()
        if not response.data:
            return templates.TemplateResponse("student.html", {
                "request": request,
                "error": "Invalid access code"
            })
        
        problem = response.data[0]
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
    except Exception as e:
        return templates.TemplateResponse("student.html", {
            "request": request,
            "error": "Failed to process submission. Please try again."
        })

@app.get("/teacher", response_class=HTMLResponse)
async def teacher_get(request: Request):
    return templates.TemplateResponse("teacher.html", {"request": request})

@app.post("/teacher", response_class=HTMLResponse)
async def teacher_post(
    request: Request,
    description: str = Form(...),
    incomplete_code: str = Form(...),
    expected_output: str = Form(...)
):
    try:
        # Generate unique code with retry logic
        max_attempts = 5
        code = None
        
        for _ in range(max_attempts):
            temp_code = str(uuid.uuid4())[:6]
            
            # Check if code already exists
            existing = supabase.from_("problems").select("code").eq("code", temp_code).execute()
            if not existing.data:
                code = temp_code
                break
        
        if not code:
            return templates.TemplateResponse("teacher.html", {
                "request": request,
                "error": "Failed to generate unique code. Please try again."
            })
        
        data = {
            "code": code,
            "description": description,
            "incomplete_code": incomplete_code,
            "expected_output": expected_output,
        }
        
        response = supabase.from_("problems").insert(data).execute()
        if response.data:
            return templates.TemplateResponse("teacher.html", {
                "request": request, 
                "code": code
            })
        else:
            raise Exception("Insert failed")
            
    except Exception as e:
        return templates.TemplateResponse("teacher.html", {
            "request": request,
            "error": "Failed to create problem. Please try again."
        })

# Health check endpoint
@app.get("/health")
async def health_check():
    try:
        # Test Supabase connection
        response = supabase.from_("problems").select("code").limit(1).execute()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail="Database connection failed")