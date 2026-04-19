from uuid import UUID

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user, require_roles
from app.auth.models import CurrentUser, UserRole
from app.db.supabase import SupabaseDataClient, get_request_data_client
from app.schemas.ai import AnalyzePatientResponse
from app.schemas.patient import PatientFullProfileResponse
from app.services.ai_service import AIService
from app.services.dependencies import get_ai_service, get_patient_service
from app.services.patient_service import PatientService

router = APIRouter(tags=["patient"])


@router.get("/patient/full-profile/{patient_id}", response_model=PatientFullProfileResponse)
async def get_patient_full_profile(
    patient_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    patient_service: PatientService = Depends(get_patient_service),
) -> PatientFullProfileResponse:
    return await patient_service.get_full_profile(
        current_user=current_user,
        patient_id=str(patient_id),
        data_client=data_client,
    )


@router.post("/patient/analyze/{patient_id}", response_model=AnalyzePatientResponse)
async def analyze_patient(
    patient_id: UUID,
    current_user: CurrentUser = Depends(require_roles(UserRole.DOCTOR)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    ai_service: AIService = Depends(get_ai_service),
) -> AnalyzePatientResponse:
    return await ai_service.analyze_patient(
        current_user=current_user,
        patient_id=str(patient_id),
        data_client=data_client,
    )
