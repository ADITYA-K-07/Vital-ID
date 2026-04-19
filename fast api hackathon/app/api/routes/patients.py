from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user, require_roles
from app.auth.models import CurrentUser, UserRole
from app.db.supabase import (
    SupabaseDataClient,
    get_request_data_client,
    get_service_data_client,
)
from app.schemas.patient import (
    DoctorDiagnosisCreateRequest,
    DoctorTreatmentCreateRequest,
    PatientMedicalHistoryCreateRequest,
    PatientFullProfileResponse,
    PatientIdentityResponse,
    PatientIdentityUpdateRequest,
    PatientTreatmentHistoryCreateRequest,
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


@router.get("/patients/lookup/{identifier}", response_model=PatientFullProfileResponse)
async def lookup_patient(
    identifier: str,
    current_user: CurrentUser = Depends(require_roles(UserRole.DOCTOR)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    patient_service: PatientService = Depends(get_patient_service),
) -> PatientFullProfileResponse:
    return await patient_service.lookup_patient(
        current_user=current_user,
        identifier=identifier,
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


@router.post("/patients/{patient_id}/diagnoses", response_model=PatientFullProfileResponse)
async def create_doctor_diagnosis(
    patient_id: str,
    payload: DoctorDiagnosisCreateRequest,
    current_user: CurrentUser = Depends(require_roles(UserRole.DOCTOR)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    service_data_client: SupabaseDataClient | None = Depends(get_service_data_client),
    patient_service: PatientService = Depends(get_patient_service),
) -> PatientFullProfileResponse:
    return await patient_service.create_doctor_diagnosis(
        current_user=current_user,
        patient_id=patient_id,
        payload=payload,
        data_client=data_client,
        service_data_client=service_data_client,
    )


@router.post("/patients/{patient_id}/treatments", response_model=PatientFullProfileResponse)
async def create_doctor_treatment(
    patient_id: str,
    payload: DoctorTreatmentCreateRequest,
    current_user: CurrentUser = Depends(require_roles(UserRole.DOCTOR)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    service_data_client: SupabaseDataClient | None = Depends(get_service_data_client),
    patient_service: PatientService = Depends(get_patient_service),
) -> PatientFullProfileResponse:
    return await patient_service.create_doctor_treatment(
        current_user=current_user,
        patient_id=patient_id,
        payload=payload,
        data_client=data_client,
        service_data_client=service_data_client,
    )


@router.post("/patients/me/treatment-history", response_model=PatientIdentityResponse)
async def create_my_treatment_history(
    payload: PatientTreatmentHistoryCreateRequest,
    current_user: CurrentUser = Depends(require_roles(UserRole.PATIENT)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    service_data_client: SupabaseDataClient | None = Depends(get_service_data_client),
    patient_service: PatientService = Depends(get_patient_service),
) -> PatientIdentityResponse:
    return await patient_service.create_patient_treatment_history(
        current_user=current_user,
        payload=payload,
        data_client=data_client,
        service_data_client=service_data_client,
    )


@router.delete("/patients/me/treatment-history/{treatment_id}", response_model=PatientIdentityResponse)
async def delete_my_treatment_history(
    treatment_id: str,
    current_user: CurrentUser = Depends(require_roles(UserRole.PATIENT)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    service_data_client: SupabaseDataClient | None = Depends(get_service_data_client),
    patient_service: PatientService = Depends(get_patient_service),
) -> PatientIdentityResponse:
    return await patient_service.delete_patient_treatment_history(
        current_user=current_user,
        treatment_id=treatment_id,
        data_client=data_client,
        service_data_client=service_data_client,
    )


@router.post("/patients/me/medical-history", response_model=PatientIdentityResponse)
async def create_my_medical_history(
    payload: PatientMedicalHistoryCreateRequest,
    current_user: CurrentUser = Depends(require_roles(UserRole.PATIENT)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    service_data_client: SupabaseDataClient | None = Depends(get_service_data_client),
    patient_service: PatientService = Depends(get_patient_service),
) -> PatientIdentityResponse:
    return await patient_service.create_patient_medical_history(
        current_user=current_user,
        payload=payload,
        data_client=data_client,
        service_data_client=service_data_client,
    )


@router.delete("/patients/me/medical-history/{history_id}", response_model=PatientIdentityResponse)
async def delete_my_medical_history(
    history_id: str,
    current_user: CurrentUser = Depends(require_roles(UserRole.PATIENT)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    service_data_client: SupabaseDataClient | None = Depends(get_service_data_client),
    patient_service: PatientService = Depends(get_patient_service),
) -> PatientIdentityResponse:
    return await patient_service.delete_patient_medical_history(
        current_user=current_user,
        history_id=history_id,
        data_client=data_client,
        service_data_client=service_data_client,
    )
