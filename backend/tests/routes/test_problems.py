"""This file contains all tests for the endpoints within routes/problems.py"""


import pytest
import json
from unittest.mock import Mock, patch, AsyncMock
from fastapi import status, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
from models.user import User as UserModel
from schemas.problem import ProblemBase, ProblemCreate
from services.code_execution_service import CodeExecutionService
from services.problem_service import ProblemService, ProblemCreate, ProblemUpdate
from exceptions import NotFoundError, ValidationError, AuthorisationError
from routes.problems import router as problem_router

@pytest.fixture

def problem_app():
    """Create a FastApi instance with the problem routes included"""
    app = FastAPI()
    app.include_router(problem_router)
    return app


@pytest.fixture
def problem_client(problem_app, db_session, test_user):
    """This creates a test client with database and authentication overides"""
   
    def get_test_db():
        """This overides the database dependency for testing"""
        yield db_session

    def get_current_user():
        """This overides the authentication dependency for testsing"""
        yield test_user

    from database import get_db
    from dependencies import get_current_user as get_current_user_dep

    problem_app.dependency_overrides[get_db] = get_test_db
    problem_app.dependency_overrides[get_current_user_dep] = get_current_user

    with TestClient(problem_app) as client:
        yield client
    
    problem_app.dependency_overrides.clear()


def test_create_problem_success(problem_client, test_user):
    """Test successful problem creation"""
    form_data = {
        "title": "Test Problem",
        "description": "Test description",
        "code_snippet": "print('Hello')",
        "expected_output": "Hello",
        "language": "python",
        "is_public": True
    }
    
    response = problem_client.post("/problems", data=form_data)
    data = response.json()
    
    assert response.status_code == status.HTTP_200_OK
    assert data["message"] == "Problem created successfully"
    assert "access_code" in data
    assert "problem_id" in data

def test_create_problem_missing_fields(problem_client):
    """Test creation with missing required fields"""
    form_data = {
        "title": "Incomplete Problem",
        "code_snippet": "print('Hello')",
        
    }
    
    response = problem_client.post("/problems", data=form_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_get_user_problems_success(problem_client, test_user, db_session):
    """Test retrieving user's problems"""

    problem_service = ProblemService(db_session)
    for _ in range(3):
        problem_service.create_problem(
            ProblemCreate(
                title="Test",
                description="Test",
                code_snippet="code",
                expected_output="output",
                language="python",
                is_public=True
            ),
            test_user
        )

    response = problem_client.get("/problems")
    data = response.json()
    
    assert response.status_code == status.HTTP_200_OK
    assert len(data) == 3
    for problem in data:
        assert problem["creator_id"] == test_user.id

def test_get_problem_by_access_code_success(problem_client, test_user, db_session):
    """Test retrieving problem by valid access code"""
    problem_service = ProblemService(db_session)
    problem = problem_service.create_problem(
        ProblemCreate(
            title="Access Test",
            description="Test",
            code_snippet="code",
            expected_output="output",
            language="python",
            is_public=False
        ),
        test_user
    )
    
    response = problem_client.get(f"/problems/access/{problem.access_code}")
    data = response.json()
    
    assert response.status_code == status.HTTP_200_OK
    assert data["id"] == problem.id
    assert data["access_code"] == problem.access_code

def test_get_problem_by_access_code_not_found(problem_client):
    """Test invalid access code returns 404"""
    response = problem_client.get("/problems/access/invalid_code")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_problem_success(problem_client, test_user, db_session):
    """Test successful problem deletion"""
    problem_service = ProblemService(db_session)
    problem = problem_service.create_problem(
        ProblemCreate(
            title="Delete Test",
            description="Test",
            code_snippet="code",
            expected_output="output",
            language="python",
            is_public=True
        ),
        test_user
    )
    
    response = problem_client.delete(f"/problems/{problem.id}")
    data = response.json()
    
    assert response.status_code == status.HTTP_200_OK
    assert data["message"] == "Problem deleted successfully"
    
    response = problem_client.get(f"/problems/access/{problem.access_code}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_problem_not_found(problem_client):
    """Test deleting non-existent problem"""
    response = problem_client.delete("/problems/9999")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_problem_unauthorized(problem_client, db_session, test_user):
    """Test deleting another user's problem"""
  
    other_user = UserModel(
        email="other@test.com",
        password_hash="password",  
        username="otheruser"
    )
    db_session.add(other_user)
    db_session.commit()
    db_session.refresh(other_user)
    
   
    problem_service = ProblemService(db_session)
    problem = problem_service.create_problem(
        ProblemCreate(
            title="Unauthorized Delete",
            description="Test",
            code_snippet="code",
            expected_output="output",
            language="python",
            is_public=True
        ),
        other_user
    )
    
    response = problem_client.delete(f"/problems/{problem.id}")
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_unauthenticated_access(problem_client, problem_app):
    """Test endpoints without authentication"""

    from dependencies import get_current_user as get_current_user_dep
    problem_app.dependency_overrides.pop(get_current_user_dep)
    
    response = problem_client.post("/problems", data={})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    response = problem_client.get("/problems")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    response = problem_client.delete("/problems/1")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
