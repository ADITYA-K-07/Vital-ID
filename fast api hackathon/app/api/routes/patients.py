from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user, require_roles
from app.auth.models import CurrentUser, UserRole
from app.db.supabase import SupabaseDataClient, get_request_data_client
from app.schemas.patient import (
    PatientFullProfileResponse,
    PatientIdentityResponse,
    PatientIdentityUpdateRequest,
)
from app.services.dependencies import get_patient_service
from app.services.patient_service import PatientService

router = APIRouter(tags=["patients"])


@router.get("/patients/{patient_id}/full-profile", response_model=PatientFullProfileResponse)
async def get_patient_full_profile(
    patient_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    patient_service: PatientService = Depends(get_patient_service),
) -> PatientFullProfileResponse:
    return await patient_service.get_full_profile(
        current_user=current_user,
        patient_id=patient_id,
        data_client=data_client,
    )


@router.get("/patients/me/identity", response_model=PatientIdentityResponse)
async def get_my_identity(
    current_user: CurrentUser = Depends(require_roles(UserRole.PATIENT)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    patient_service: PatientService = Depends(get_patient_service),
) -> PatientIdentityResponse:
    return await patient_service.get_my_identity(
        current_user=current_user,
        data_client=data_client,
    )


@router.patch("/patients/me/identity", response_model=PatientIdentityResponse)
async def patch_my_identity(
    payload: PatientIdentityUpdateRequest,
    current_user: CurrentUser = Depends(require_roles(UserRole.PATIENT)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    patient_service: PatientService = Depends(get_patient_service),
) -> PatientIdentityResponse:
    return await patient_service.update_my_identity(
        current_user=current_user,
        payload=payload,
        data_client=data_client,
    )
