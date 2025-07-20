import pytest
import httpx
from fastapi.testclient import TestClient
from main import app  

class TestBasicEndpoints:
    def test_app_starts(self):
  
        with TestClient(app) as client:
            response = client.get("/")
            assert response.status_code in [200, 404] 
    
    def test_docs_endpoint(self):
        with TestClient(app) as client:
            response = client.get("/docs")
            assert response.status_code == 200