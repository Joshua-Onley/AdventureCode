from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError

from database import get_db
from models.user import User
from utils.auth import decode_access_token
from exceptions import AuthenticationError, NotFoundError, AuthorisationError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

async def get_current_user(
        token: str = Depends(oauth2_scheme),
        db: Session = Depends(get_db)
) -> User:
    try: 
        username = decode_access_token(token)
        if username is None: 
            raise AuthenticationError("invalid or expired token")
        
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise NotFoundError
        
        return user
    except JWTError:
        raise AuthenticationError("Token Validation Failed")
    

async def get_admin_user(
        current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_admin:
        raise AuthorisationError("Admin privileges required")
    return current_user