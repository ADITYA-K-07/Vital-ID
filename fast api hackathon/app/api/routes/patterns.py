from fastapi import APIRouter, Depends

from app.auth.dependencies import require_roles
from app.auth.models import CurrentUser, UserRole
from app.db.supabase import SupabaseDataClient, get_request_data_client
from app.schemas.patterns import PatternDetectRequest, PatternDetectResponse
from app.services.dependencies import get_patterns_service
from app.services.patterns_service import PatternsService

router = APIRouter(tags=["patterns"])


@router.post("/patterns/detect", response_model=PatternDetectResponse)
async def detect_patterns(
    payload: PatternDetectRequest,
    current_user: CurrentUser = Depends(require_roles(UserRole.DOCTOR)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    patterns_service: PatternsService = Depends(get_patterns_service),
) -> PatternDetectResponse:
    return await patterns_service.detect_patterns(
        current_user=current_user,
        data_client=data_client,
        payload=payload,
    )
