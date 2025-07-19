import os
from functools import lru_cache
from pydantic import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://username:password@localhost/dbname"

    SECRET_KEY: str = "your-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 180

    ALLOWED_ORIGINS: List[str] = [
        "https://victorious-bay-07769b703.1.azurestaticapps.net",
        "https://adventurecode-bcekcrhpauffhzbn.uksouth-01.azurewebsites.net",
        "http://localhost:5173",
        "http://127.0.0.1:8000"
    ]

    PISTON_URL: str = "https://emkc.org/api/v2/piston/execute"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
