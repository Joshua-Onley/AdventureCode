from fastapi import APIRouter, Depends, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database import get_db
from services.auth_service import AuthService
from schemas.user import UserCreate, UserResponse
from dependencies import get_current_user
from models.user import User

router = APIRouter()

@router.post("/signup", response_model=dict)
async def signup(
    name: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    auth_service = AuthService(db)
    user_data = UserCreate(name=name, username=username, password=password)
    user = auth_service.create_user(user_data)
    
    return {
        "msg": "Account created",
        "user": {"id": user.id, "username": user.username}
    }

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    auth_service = AuthService(db)
    user = auth_service.authenticate_user(form_data.username, form_data.password)
    access_token = auth_service.create_access_token_for_user(user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user.id, "username": user.username}
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        name=current_user.name
    )
