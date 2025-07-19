from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    username: str
    name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    
    class Config:
        orm_mode = True

class UserInDB(UserBase):
    id: int
    password_hash: str
    is_admin: bool = False
    
    class Config:
        orm_mode = True