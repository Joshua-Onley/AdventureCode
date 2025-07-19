from sqlalchemy.orm import Session
from models.user import User
from schemas.user import UserCreate
from utils.auth import hash_password, verify_password, create_access_token
from exceptions import ValidationError, AuthenticationError

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def create_user(self, user_data: UserCreate) -> User:

        if self.db.query(User).filter(User.username == user_data.username).first():
            raise ValidationError("Username Already registered")
        
        hashed_password = hash_password(user_data.password)
        user = User(
            name=user_data.name,
            username=user_data.username,
            password_hash=hashed_password
        )

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user
    
    def authenticate_user(self, username: str, password: str) -> User:
        user = self.db.query(User).filter(User.username == username).first()

        if not user or not verify_password(password, user.password_hash):
            raise AuthenticationError("invalid credentials")
        
        return user
    
    def create_access_token_for_user(self, user: User) -> str:
        return create_access_token(data={"sub": user.username})
