"""
Configuration settings for the NC Healthcare Vulnerability Index application.
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///../../nc_healthcare.db"
    DATABASE_URL_SYNC: str = "sqlite:///../../nc_healthcare.db"
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "NC Healthcare Vulnerability Index"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "API for North Carolina Healthcare Vulnerability mapping and analysis"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"
    
    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    # Data Processing
    DATA_DIR: str = "./data"
    RAW_DATA_DIR: str = "./data/raw"
    PROCESSED_DATA_DIR: str = "./data/processed"
    GEOGRAPHIC_DATA_DIR: str = "./data/geographic"
    OUTPUTS_DIR: str = "./data/outputs"
    
    # External APIs
    CENSUS_API_KEY: Optional[str] = None
    MAPBOX_ACCESS_TOKEN: Optional[str] = None
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra environment variables


# Global settings instance
settings = Settings()