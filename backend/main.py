from jose import JWTError
from fastapi import FastAPI, Depends, HTTPException, Form, Security
from sqlalchemy.orm import Session
from database import engine, get_db
from models import Base, User, Problem, Adventure, Submission
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from datetime import datetime, timedelta
from auth import hash_password, verify_password, create_access_token, decode_access_token
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "https://victorious-bay-07769b703.1.azurestaticapps.net",
    "http://localhost:5173",
    "http://127.0.0.1:8000"  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        email = decode_access_token(token)
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user = db.query(User).filter(User.email == email).first()
        print(f"{user}")
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except JWTError as e:  
        raise HTTPException(status_code=401, detail="Token validation failed")

@app.get("/")
async def read_root():
    return {"message": "API root"}

@app.post("/signup")
async def signup(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_pw = hash_password(password)
    user = User(name=name, email=email, password=hashed_pw)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"msg": "Account created", "user": {"id": user.id, "email": user.email}}

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": user.email})
    print(f"Generated token: {access_token}") 
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": user.id, "email": user.email}}

@app.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name
    }


@app.get("/users")
async def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return {"users": users}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
