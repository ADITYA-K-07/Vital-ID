from fastapi import APIRouter

from app.api.routes.alerts import router as alerts_router
from app.api.routes.auth import router as auth_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.demo import router as demo_router
from app.api.routes.diagnosis import router as diagnosis_router
from app.api.routes.forum import router as forum_router
from app.api.routes.legacy import router as legacy_router
from app.api.routes.me import router as me_router
from app.api.routes.notes import router as notes_router
from app.api.routes.patterns import router as patterns_router
from app.api.routes.patients import router as patients_router

api_router = APIRouter()

api_v1_router = APIRouter(prefix="/api")
api_v1_router.include_router(auth_router)
api_v1_router.include_router(me_router)
api_v1_router.include_router(dashboard_router)
api_v1_router.include_router(patients_router)
api_v1_router.include_router(alerts_router)
api_v1_router.include_router(notes_router)
api_v1_router.include_router(patterns_router)
api_v1_router.include_router(forum_router)
api_v1_router.include_router(diagnosis_router)

api_router.include_router(api_v1_router)
api_router.include_router(legacy_router)
api_router.include_router(demo_router)
