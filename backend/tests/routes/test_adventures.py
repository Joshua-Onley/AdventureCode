"""This file contains all tests for the endpoints within routes/adventures.py"""


import pytest
import json
from unittest.mock import Mock, patch, AsyncMock
from fastapi import status, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
from routes.adventures import router as adventure_router
from models.adventure import Adventure as AdventureModel, AdventureAttempt as AdventureAttemptModel
from models.user import User as UserModel
from schemas.adventure import (
    AdventureCreate as AdventureCreateSchema,
    AdventureUpdate as AdventureUpdateSchema,
    AdventureProgress as AdventureProgressSchema
)
from schemas.problem import ProblemBase, ProblemCreate
from services.adventure_service import AdventureService
from services.code_execution_service import CodeExecutionService
from exceptions import NotFoundError, ValidationError, AuthorisationError

@pytest.fixture

def adventure_app():
    """Create a FastApi instance with the adventure routes included"""
    app = FastAPI()
    app.include_router(adventure_router)
    return app


@pytest.fixture
def adventure_client(adventure_app, db_session, test_user):
    """This creates a test client with database and authentication overides"""
   
    def get_test_db():
        """This overides the database dependency for testing"""
        yield db_session

    def get_current_user():
        """This overides the authentication dependency for testsing"""
        yield test_user

    from database import get_db
    from dependencies import get_current_user as get_current_user_dep

    # overide dependencies with test versions
    adventure_app.dependency_overrides[get_db] = get_test_db
    adventure_app.dependency_overrides[get_current_user_dep] = get_current_user

    with TestClient(adventure_app) as client:
        yield client
    
    adventure_app.dependency_overrides.clear()

# Mock data for testing

mock_problems = [
    ProblemCreate(
        title="Problem 1",
        description="Print 'Hello World' to the console",
        code_snippet="print('Hello World')",
        expected_output="Hello World\n",
        language="python",
        is_public=True
    ).dict(),
    ProblemCreate(
        title="Problem 2",
        description="Print the sum of 1 and 1",
        code_snippet="print(1+1)",
        expected_output="2\n",
        language="python",
        is_public=True
    ).dict(),
]

mock_nodes = [
    {
        "id": str(uuid.uuid4()),
        "position": {"x": 0.0, "y": 0.0},
        "data": mock_problems[0], 
        "type": "start"
    },
    {
        "id": str(uuid.uuid4()),
        "position": {"x": 1.0, "y": 1.0},
        "data": mock_problems[1],
        "type": "end"
    }
]

mock_edges = [
    {
        "id": "edge1",
        "source": mock_nodes[0]["id"],
        "target": mock_nodes[1]["id"],
        "data": {},
        "type": "default"
    }
]

mock_graph_data = {
    "nodes": mock_nodes,
    "edges": mock_edges
}

mock_adventure_create = {
    "name": "Test Adventure",
    "description": "A test adventure",
    "is_public": True,
    "request_public": False,
    "problems": mock_problems,
    "graph_data": mock_graph_data
}

mock_adventure = {
    "id": 1,
    "creator_id": 42,
    "name": "Test Adventure",
    "description": "A test adventure",
    "is_public": True,
    "request_public": False,
    "total_attempts": 10,
    "total_completions": 5,
    "avg_completion_time": timedelta(minutes=15),
    "best_completion_time": timedelta(minutes=10),
    "approval_status": "approved",
    "approval_requested_at": datetime.utcnow() - timedelta(days=1),
    "approved_at": datetime.utcnow(),
    "approved_by": 1,
    "access_code": "ABC123",
    "access_code_expires_at": datetime.utcnow() + timedelta(days=7),
    "created_at": datetime.utcnow(),
    "start_node_id": str(mock_nodes[0]["id"]),
    "end_node_id": str(mock_nodes[1]["id"]),
    "graph_data": mock_graph_data  
}


# testing class for the adventure creation endpoint
class TestCreateAdventure:

    @patch('routes.adventures.AdventureService')
    def test_create_adventure_success(self, mock_service_class, adventure_client):
        """Test successful adventure creation"""
        mock_service = mock_service_class.return_value
        mock_service.create_adventure.return_value = mock_adventure
        response = adventure_client.post("/adventures/", json=mock_adventure_create)
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "Test Adventure"
        assert data["description"] == "A test adventure"
        assert data["is_public"] is True

    @patch('routes.adventures.AdventureService')
    def test_create_adventure_validation_error(self, mock_service_class, adventure_client):
        """Test adventure creation with validation error"""
        mock_service = mock_service_class.return_value
        mock_service.create_adventure.side_effect = ValidationError("Invalid data")
        response = adventure_client.post("/adventures/", json=mock_adventure_create)
        
        assert response.status_code == 400
        data = response.json()
        assert "Validation failed" in data["error"]

    @patch('routes.adventures.AdventureService')
    def test_create_adventure_internal_error(self, mock_service_class, adventure_client):
        """Test adventure creation with internal server error"""
        mock_service = mock_service_class.return_value
        mock_service.create_adventure.side_effect = Exception("Database error")
        response = adventure_client.post("/adventures/", json=mock_adventure_create)
        
        assert response.status_code == 500
        data = response.json()
        assert "Internal server error" in data["error"]


class TestFetchPublicAdventures:
    """Test the GET /adventures/public endpoint"""

    @patch('routes.adventures.AdventureService')
    def test_fetch_public_adventures_success(self, mock_service_class, adventure_client):
        """Test successful fetching of public adventures"""
        mock_service = mock_service_class.return_value
        mock_adventures = [
            {"id": 1, "name": "Adventure 1", "is_public": True},
            {"id": 2, "name": "Adventure 2", "is_public": True}
        ]
        mock_service.get_public_adventures.return_value = mock_adventures
        
        response = adventure_client.get("/adventures/public")
        
        assert response.status_code == 200
        data = response.json()
        assert "adventures" in data
        assert len(data["adventures"]) == 2

    @patch('routes.adventures.AdventureService')
    def test_fetch_public_adventures_internal_error(self, mock_service_class, adventure_client):
        """Test fetching public adventures with internal error"""
        mock_service = mock_service_class.return_value
        mock_service.get_public_adventures.side_effect = Exception("Database error")
        
        response = adventure_client.get("/adventures/public")
        
        assert response.status_code == 500
        data = response.json()
        assert "Internal server error" in data["error"]


class TestGetAdventureByCode:
    """Test the GET /adventures/access/{access_code} endpoint"""

    @patch('routes.adventures.AdventureService')
    def test_get_adventure_by_code_success(self, mock_service_class, adventure_client):
        """Test successful retrieval of adventure by access code"""
        mock_service = mock_service_class.return_value
        mock_adventure = {"id": 1, "name": "Test Adventure", "access_code": "ABC123"}
        mock_service.get_adventure_by_access_code.return_value = mock_adventure
        
        response = adventure_client.get("/adventures/access/ABC123")
        
        assert response.status_code == 200
        data = response.json()
        assert data["access_code"] == "ABC123"

    @patch('routes.adventures.AdventureService')
    def test_get_adventure_by_code_not_found(self, mock_service_class, adventure_client):
        """Test adventure not found by access code"""
        mock_service = mock_service_class.return_value
        mock_service.get_adventure_by_access_code.side_effect = NotFoundError("Adventure not found")
        
        response = adventure_client.get("/adventures/access/INVALID")
        
        assert response.status_code == 404
        data = response.json()
        assert "Adventure not found" in data["error"]

    @patch('routes.adventures.AdventureService')
    def test_get_adventure_by_code_internal_error(self, mock_service_class, adventure_client):
        """Test internal error when getting adventure by code"""
        mock_service = mock_service_class.return_value
        mock_service.get_adventure_by_access_code.side_effect = Exception("Database error")
        
        response = adventure_client.get("/adventures/access/ABC123")
        
        assert response.status_code == 500
        data = response.json()
        assert "Internal server error" in data["error"]


class TestListUserAdventures:
    """Test the GET /adventures/ endpoint"""

    @patch('routes.adventures.AdventureService')
    def test_list_user_adventures_success(self, mock_service_class, adventure_client):
        """Test successful listing of user adventures"""
        mock_service = mock_service_class.return_value
        mock_adventures = [
            {
                "id": 1, 
                "name": "My Adventure 1",
                "creator_id": 1,
                "total_attempts": 0,
                "total_completions": 0,
                "created_at": "2024-01-01T00:00:00",
                "start_node_id": "start",
                "end_node_id": "end"
            },
            {
                "id": 2, 
                "name": "My Adventure 2",
                "creator_id": 1,
                "total_attempts": 0,
                "total_completions": 0,
                "created_at": "2024-01-01T00:00:00",
                "start_node_id": "start",
                "end_node_id": "end"
            }
        ]
        mock_service.get_user_adventures.return_value = mock_adventures
        
        response = adventure_client.get("/adventures/")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    @patch('routes.adventures.AdventureService')
    def test_list_user_adventures_internal_error(self, mock_service_class, adventure_client):
        """Test internal error when listing user adventures"""
        mock_service = mock_service_class.return_value
        mock_service.get_user_adventures.side_effect = Exception("Database error")
        
        response = adventure_client.get("/adventures/")
        
        assert response.status_code == 500
        data = response.json()
        assert "Internal server error" in data["error"]


class TestViewAdventure:
    """Test the GET /adventures/{adventure_id} endpoint"""

    @patch('routes.adventures.AdventureService')
    def test_view_adventure_success(self, mock_service_class, adventure_client):
        """Test successful viewing of specific adventure"""
        mock_service = mock_service_class.return_value
        mock_adventure = {"id": 1, "name": "Test Adventure", "description": "Test description"}
        mock_service.get_adventure_by_id.return_value = mock_adventure
        
        response = adventure_client.get("/adventures/1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["name"] == "Test Adventure"

    @patch('routes.adventures.AdventureService')
    def test_view_adventure_not_found(self, mock_service_class, adventure_client):
        """Test viewing non-existent adventure"""
        mock_service = mock_service_class.return_value
        mock_service.get_adventure_by_id.side_effect = NotFoundError("Adventure not found")
        
        response = adventure_client.get("/adventures/999")
        
        assert response.status_code == 404
        data = response.json()
        assert "Adventure not found" in data["error"]

    @patch('routes.adventures.AdventureService')
    def test_view_adventure_internal_error(self, mock_service_class, adventure_client):
        """Test internal error when viewing adventure"""
        mock_service = mock_service_class.return_value
        mock_service.get_adventure_by_id.side_effect = Exception("Database error")
        
        response = adventure_client.get("/adventures/1")
        
        assert response.status_code == 500
        data = response.json()
        assert "Internal server error" in data["error"]


class TestUpdateAdventure:
    """Test the PUT /adventures/{adventure_id} endpoint"""

    @patch('routes.adventures.AdventureService')
    def test_update_adventure_success(self, mock_service_class, adventure_client):
        """Test successful adventure update"""
        mock_service = mock_service_class.return_value
        mock_adventure = {
            "id": 1, 
            "name": "Updated Adventure", 
            "description": "Updated description",
            "creator_id": 1,
            "total_attempts": 0,
            "total_completions": 0,
            "created_at": "2024-01-01T00:00:00",
            "start_node_id": "start",
            "end_node_id": "end"
        }
        mock_service.update_adventure.return_value = mock_adventure
        
        update_data = {
            "name": "Updated Adventure",
            "description": "Updated description"
        }
        
        response = adventure_client.put("/adventures/1", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Adventure"

    @patch('routes.adventures.AdventureService')
    def test_update_adventure_not_found(self, mock_service_class, adventure_client):
        """Test updating non-existent adventure"""
        mock_service = mock_service_class.return_value
        mock_service.update_adventure.side_effect = NotFoundError("Adventure not found")
        
        update_data = {"name": "Updated Adventure"}
        response = adventure_client.put("/adventures/999", json=update_data)
        
        assert response.status_code == 404
        data = response.json()
        assert "Adventure not found" in data["error"]

    @patch('routes.adventures.AdventureService')
    def test_update_adventure_unauthorized(self, mock_service_class, adventure_client):
        """Test updating adventure without authorization"""
        mock_service = mock_service_class.return_value
  
        auth_error = AuthorisationError("Not authorized")
        mock_service.update_adventure.side_effect = auth_error
        
        update_data = {"name": "Updated Adventure"}
        response = adventure_client.put("/adventures/1", json=update_data)
        
        assert response.status_code == 403
        data = response.json()
        assert "Forbidden" in data["error"]

    @patch('routes.adventures.AdventureService')
    def test_update_adventure_internal_error(self, mock_service_class, adventure_client):
        """Test internal error when updating adventure"""
        mock_service = mock_service_class.return_value
        mock_service.update_adventure.side_effect = Exception("Database error")
        
        update_data = {"name": "Updated Adventure"}
        response = adventure_client.put("/adventures/1", json=update_data)
        
        assert response.status_code == 500
        data = response.json()
        assert "Internal server error" in data["error"]


class TestDeleteAdventure:
    """Test the DELETE /adventures/{adventure_id} endpoint"""

    @patch('routes.adventures.AdventureService')
    def test_delete_adventure_success(self, mock_service_class, adventure_client):
        """Test successful adventure deletion"""
        mock_service = mock_service_class.return_value
        mock_service.delete_adventure.return_value = None
        
        response = adventure_client.delete("/adventures/1")
        
        assert response.status_code == 200
        data = response.json()
        assert "Adventure deleted successfully" in data["message"]

    @patch('routes.adventures.AdventureService')
    def test_delete_adventure_not_found(self, mock_service_class, adventure_client):
        """Test deleting non-existent adventure"""
        mock_service = mock_service_class.return_value
        mock_service.delete_adventure.side_effect = NotFoundError("Adventure not found")
        
        response = adventure_client.delete("/adventures/999")
        
        assert response.status_code == 404
        data = response.json()
        assert "Adventure not found" in data["error"]

    @patch('routes.adventures.AdventureService')
    def test_delete_adventure_unauthorized(self, mock_service_class, adventure_client):
        """Test deleting adventure without authorization"""
        mock_service = mock_service_class.return_value
       
        auth_error = AuthorisationError("Not authorized")
        mock_service.delete_adventure.side_effect = auth_error
        
        response = adventure_client.delete("/adventures/1")
        
        assert response.status_code == 403
        data = response.json()
        assert "Forbidden" in data["error"]

    @patch('routes.adventures.AdventureService')
    def test_delete_adventure_internal_error(self, mock_service_class, adventure_client):
        """Test internal error when deleting adventure"""
        mock_service = mock_service_class.return_value
        mock_service.delete_adventure.side_effect = Exception("Database error")
        
        response = adventure_client.delete("/adventures/1")
        
        assert response.status_code == 500
        data = response.json()
        assert "Internal server error" in data["error"]


class TestAdventureAttempts:
    """Test adventure attempt related endpoints"""

    @patch('routes.adventures.AdventureService')
    def test_get_or_start_adventure_attempt_success(self, mock_service_class, adventure_client):
        """Test successful retrieval/start of adventure attempt"""
        mock_service = mock_service_class.return_value
        mock_attempt = {
            "id": 1, 
            "adventure_id": 1, 
            "user_id": 1, 
            "end_time": datetime.now(),
            "completed": True,
            "path_taken": [{}, {}, {}],
            "current_node_id": str(uuid.uuid4()),
            "start_time": "2024-01-01T00:00:00"
        }
        mock_service.get_or_start_adventure_attempt.return_value = mock_attempt
        
        response = adventure_client.get("/adventures/1/attempt")
        
        assert response.status_code == 200
        data = response.json()
        assert data["adventure_id"] == 1

    @patch('routes.adventures.AdventureService')
    def test_get_or_start_adventure_attempt_not_found(self, mock_service_class, adventure_client):
        """Test adventure attempt for non-existent adventure"""
        mock_service = mock_service_class.return_value
        mock_service.get_or_start_adventure_attempt.side_effect = NotFoundError("Adventure not found")
        
        response = adventure_client.get("/adventures/999/attempt")
        
        assert response.status_code == 404
        data = response.json()
        assert "Adventure not found" in data["error"]

    @patch('routes.adventures.AdventureService')
    def test_get_user_attempts_success(self, mock_service_class, adventure_client):
        """Test successful retrieval of user attempts"""
        mock_service = mock_service_class.return_value
        mock_attempts = [
                    {
                        "id": 1, 
                        "adventure_id": 1, 
                        "user_id": 1, 
                        "end_time": datetime.now(),
                        "completed": True,
                        "path_taken": [{}, {}, {}],
                        "current_node_id": str(uuid.uuid4()),
                        "start_time": datetime.now()
                    },
                    {"id": 1, 
                        "adventure_id": 3, 
                        "user_id": 2, 
                        "end_time": datetime.now(),
                        "completed": False,
                        "path_taken": [{}, {}, {}],
                        "current_node_id": str(uuid.uuid4()),
                        "start_time": datetime.now()
                    }
        ]
        mock_service.get_user_attempts.return_value = mock_attempts
        
        response = adventure_client.get("/adventures/attempts")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    @patch('routes.adventures.AdventureService')
    def test_get_user_attempts_with_adventure_filter(self, mock_service_class, adventure_client):
        """Test retrieval of user attempts filtered by adventure"""
        mock_service = mock_service_class.return_value
        mock_attempts = [
                    {
                        "id": 1, 
                        "adventure_id": 1, 
                        "user_id": 1, 
                        "end_time": datetime.now(),
                        "completed": True,
                        "path_taken": [{}, {}, {}],
                        "current_node_id": str(uuid.uuid4()),
                        "start_time": datetime.now()
                    },
                    {"id": 1, 
                        "adventure_id": 3, 
                        "user_id": 2, 
                        "end_time": datetime.now(),
                        "completed": False,
                        "path_taken": [{}, {}, {}],
                        "current_node_id": str(uuid.uuid4()),
                        "start_time": datetime.now()
                    }
        ]
        mock_service.get_user_attempts.return_value = mock_attempts
        
        response = adventure_client.get("/adventures/attempts?adventure_id=1")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    @patch('routes.adventures.AdventureService')
    def test_update_attempt_progress_success(self, mock_service_class, adventure_client):
        """Test successful update of attempt progress"""
        mock_service = mock_service_class.return_value
        mock_attempt = {
                        "id": 1, 
                        "adventure_id": 1, 
                        "user_id": 1, 
                        "end_time": datetime.now(),
                        "completed": True,
                        "path_taken": [{}, {}, {}],
                        "current_node_id": str(uuid.uuid4()),
                        "start_time": datetime.now()
                    }
        
        mock_service.update_attempt_progress.return_value = mock_attempt
        
        progress_data = {
        "current_node_id": str(uuid.uuid4()),
        "outcome": "started",
        "code": "print('hello world')",  
        }

        response = adventure_client.patch("/adventures/attempts/1/progress", json=progress_data)
        
        assert response.status_code == 200
        data = response.json()
        

    @patch('routes.adventures.AdventureService')
    def test_update_attempt_progress_not_found(self, mock_service_class, adventure_client):
        """Test updating progress for non-existent attempt"""
        mock_service = mock_service_class.return_value
        mock_service.update_attempt_progress.side_effect = NotFoundError("Attempt not found")
        
        progress_data = {
        "current_node_id": str(uuid.uuid4()),
        "outcome": "started",
        "code": "print('hello world')",  
        }

        response = adventure_client.patch("/adventures/attempts/999/progress", json=progress_data)
        
        assert response.status_code == 404
        data = response.json()
        assert "Attempt not found" in data["error"]


class TestAdventureSubmissions:
    """Test the POST /adventures/submissions endpoint"""

    @patch('routes.adventures.AdventureService')
    @patch('routes.adventures.CodeExecutionService')
    def test_submit_adventure_problem_success(self, mock_code_service_class, mock_service_class, adventure_client):
        """Test successful adventure problem submission"""
       
        mock_service = mock_service_class.return_value
        mock_attempts = [Mock(id=1, adventure_id=1, user_id=1)]
        mock_service.get_user_attempts.return_value = mock_attempts
        
        mock_adventure = Mock()
        mock_adventure.graph_data = {
            "nodes": [
                {
                    "id": "node_1",
                    "data": {"expected_output": "Hello World"}
                }
            ]
        }
        mock_service.get_adventure_by_id.return_value = mock_adventure
        mock_service.submit_adventure_problem.return_value = None
        
        mock_code_service = mock_code_service_class.return_value
        mock_code_service.execute_code = AsyncMock(return_value={
            "output": "Hello World",
            "stdout": "Hello World\n",
            "stderr": ""
        })
        
        form_data = {
            "attempt_id": 1,
            "node_id": "node_1",
            "code": "print('Hello World')",
            "language": "python"
        }
        
        response = adventure_client.post("/adventures/submissions", data=form_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_correct"] is True
        assert "Correct! Well done." in data["message"]

    @patch('routes.adventures.AdventureService')
    @patch('routes.adventures.CodeExecutionService')
    def test_submit_adventure_problem_incorrect(self, mock_code_service_class, mock_service_class, adventure_client):
        """Test incorrect adventure problem submission"""
        
        mock_service = mock_service_class.return_value
        mock_attempts = [Mock(id=1, adventure_id=1, user_id=1)]
        mock_service.get_user_attempts.return_value = mock_attempts
        
        mock_adventure = Mock()
        mock_adventure.graph_data = {
            "nodes": [
                {
                    "id": "node_1",
                    "data": {"expected_output": "Hello World"}
                }
            ]
        }
        mock_service.get_adventure_by_id.return_value = mock_adventure
        mock_service.submit_adventure_problem.return_value = None
        
    
        mock_code_service = mock_code_service_class.return_value
        mock_code_service.execute_code = AsyncMock(return_value={
            "output": "Wrong Output",
            "stdout": "Wrong Output\n",
            "stderr": ""
        })
        
        form_data = {
            "attempt_id": 1,
            "node_id": "node_1",
            "code": "print('Wrong Output')",
            "language": "python"
        }
        
        response = adventure_client.post("/adventures/submissions", data=form_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_correct"] is False
        assert "Incorrect" in data["message"]

    @patch('routes.adventures.AdventureService')
    def test_submit_adventure_problem_attempt_not_found(self, mock_service_class, adventure_client):
        """Test submission with non-existent attempt"""
        mock_service = mock_service_class.return_value
        mock_service.get_user_attempts.return_value = []  
        
        form_data = {
            "attempt_id": 999,
            "node_id": "node_1",
            "code": "print('Hello World')",
            "language": "python"
        }
        
        response = adventure_client.post("/adventures/submissions", data=form_data)
        
        assert response.status_code == 404
        data = response.json()
        assert "Adventure attempt not found" in data["error"]

    @patch('routes.adventures.AdventureService')
    def test_submit_adventure_problem_node_not_found(self, mock_service_class, adventure_client):
        """Test submission with non-existent node"""
        mock_service = mock_service_class.return_value
        mock_attempts = [Mock(id=1, adventure_id=1, user_id=1)]
        mock_service.get_user_attempts.return_value = mock_attempts
        
        mock_adventure = Mock()
        mock_adventure.graph_data = {"nodes": []}  
        mock_service.get_adventure_by_id.return_value = mock_adventure
        
        form_data = {
            "attempt_id": 1,
            "node_id": "non_existent_node",
            "code": "print('Hello World')",
            "language": "python"
        }
        
        response = adventure_client.post("/adventures/submissions", data=form_data)
        
        assert response.status_code == 404
        data = response.json()
        assert "Node not found in this adventure" in data["error"]


class TestCompletedPublicAdventures:
    """Test the GET /adventures/users/{user_id}/completed_public_adventures endpoint"""

    def test_get_completed_public_adventures_success(self, adventure_client, db_session):
        """Test successful retrieval of completed public adventures"""
       
        adventure1 = AdventureModel(
            id=1,
            creator_id=42,
            name="Test Adventure 1",
            description="First test adventure",
            is_public=True,
            total_attempts=10,
            total_completions=5,
            avg_completion_time=timedelta(minutes=15),
            best_completion_time=timedelta(minutes=10),
            approval_status="approved",
            approval_requested_at=datetime.utcnow() - timedelta(days=1),
            approved_at=datetime.utcnow(),
            approved_by=1,
            access_code="ABC123",
            access_code_expires_at=datetime.utcnow() + timedelta(days=7),
            created_at=datetime.utcnow(),
            start_node_id=str(uuid.uuid4()), 
            end_node_id=str(uuid.uuid4()),    
            graph_data={"nodes": [], "edges": []} 
        )
        
        adventure2 = AdventureModel(
            id=2,
            creator_id=42,
            name="Test Adventure 2",
            description="Second test adventure",
            is_public=True,
            total_attempts=8,
            total_completions=4,
            avg_completion_time=timedelta(minutes=20),
            best_completion_time=timedelta(minutes=12),
            approval_status="approved",
            approval_requested_at=datetime.utcnow() - timedelta(days=2),
            approved_at=datetime.utcnow(),
            approved_by=1,
            access_code="DEF456",
            access_code_expires_at=datetime.utcnow() + timedelta(days=7),
            created_at=datetime.utcnow(),
            start_node_id=str(uuid.uuid4()),  
            end_node_id=str(uuid.uuid4()),    
            graph_data={"nodes": [], "edges": []}
        )
        
        db_session.add_all([adventure1, adventure2])
        db_session.flush()          
        
        start_node_id = str(uuid.uuid4())  
        attempt1 = AdventureAttemptModel(
            adventure_id=adventure1.id,
            user_id=1,
            completed=True,
            current_node_id=adventure1.end_node_id,  
            start_node_id=start_node_id, 
            start_time=datetime.utcnow(),
            end_time=datetime.utcnow()  
        )
        
        attempt2 = AdventureAttemptModel(
            adventure_id=adventure2.id,
            user_id=1,
            completed=True,
            current_node_id=adventure2.end_node_id,  
            start_node_id=start_node_id, 
            start_time=datetime.utcnow(),
            end_time=datetime.utcnow() 
        )
        
        db_session.add_all([attempt1, attempt2])
        db_session.commit()
        
        response = adventure_client.get("/adventures/users/1/completed_public_adventures")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(adventure["is_public"] for adventure in data)

    def test_get_completed_public_adventures_empty(self, adventure_client):
        """Test retrieval when user has no completed public adventures"""
        response = adventure_client.get("/adventures/users/999/completed_public_adventures")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0


