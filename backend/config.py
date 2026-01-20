import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 240
    ALLOWED_ORIGINS: List[str]
    PISTON_URL: str = "https://emkc.org/api/v2/piston/execute"

    # Environment identifier
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        extra = "allow"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
