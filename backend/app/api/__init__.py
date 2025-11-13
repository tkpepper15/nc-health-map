from fastapi import APIRouter
from .counties import router as counties_router
from .healthcare import router as healthcare_router
from .exports import router as exports_router
from .news import router as news_router

api_router = APIRouter()

api_router.include_router(counties_router, prefix="/counties", tags=["counties"])
api_router.include_router(healthcare_router, prefix="/healthcare", tags=["healthcare"])
api_router.include_router(exports_router, prefix="/exports", tags=["exports"])
api_router.include_router(news_router, prefix="/news", tags=["news"])