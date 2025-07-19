from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import traceback

from config import get_settings
from exceptions import AppException
from database import engine
from models import Base
from routes import auth, problems, adventures, submissions

Base.metadata.create_all(bind=engine)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="AdventureCode API",
        description="API for coding adventures and problems (MSc Project)" 
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(AppException)
    async def app_exception_handler(request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message, "detail": exc.detail}
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc: Exception):
        logger.error("Unhandled exception", exc_info=exc)
        return JSONResponse(
            status_code=500,
            content={"error": "internal server error"}
        )
    
    app.include_router(auth.router, prefix="/api", tags=["auth"])
    app.include_router(problems.router, prefix="/api", tags=["problems"])
    app.include_router(adventures.router, prefix="/api", tags=["adventures"])
    app.include_router(submissions.router, prefix="/api", tags=["submissions"])

    @app.get("/")
    async def root():
        return {"message": "AdventureCode API"}
    
    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}
    
    return app

app = create_app()





