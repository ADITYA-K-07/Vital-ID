from fastapi import APIRouter, Depends

from app.auth.dependencies import require_roles
from app.auth.models import CurrentUser, UserRole
from app.schemas.diagnosis import SimilarCasesRequest, SimilarCasesResponse
from app.services.dependencies import get_diagnosis_service
from app.services.diagnosis_service import DiagnosisService

router = APIRouter(tags=["diagnosis"])


@router.post("/diagnosis/similar-cases", response_model=SimilarCasesResponse)
async def similar_cases(
    payload: SimilarCasesRequest,
    current_user: CurrentUser = Depends(require_roles(UserRole.DOCTOR)),
    diagnosis_service: DiagnosisService = Depends(get_diagnosis_service),
) -> SimilarCasesResponse:
    return await diagnosis_service.find_similar_cases(payload=payload)
