"""
Dependencies module for FastAPI application.
"""

from functools import lru_cache
from .config import Settings

@lru_cache()
def get_settings() -> Settings:
    """
    Get cached application settings.
    Using lru_cache to avoid loading .env file for each request
    """
    return Settings()