from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.auth.models import CurrentUser
from app.db.supabase import (
    SupabaseDataClient,
    get_request_data_client,
    get_service_data_client,
)
from app.schemas.auth import (
    DoctorLicenseCheckRequest,
    DoctorLicenseCheckResponse,
    SessionBootstrapRequest,
    SessionBootstrapResponse,
)
from app.services.auth_service import AuthService
from app.services.dependencies import get_auth_service

router = APIRouter(tags=["auth"])


@router.post(
    "/auth/doctor/license-check",
    response_model=DoctorLicenseCheckResponse,
)
async def doctor_license_check(
    payload: DoctorLicenseCheckRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> DoctorLicenseCheckResponse:
    return await auth_service.check_doctor_license(
        license_number=payload.license_number,
    )


@router.post(
    "/session/bootstrap",
    response_model=SessionBootstrapResponse,
)
async def session_bootstrap(
    payload: SessionBootstrapRequest,
    current_user: CurrentUser = Depends(get_current_user),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    service_data_client: SupabaseDataClient | None = Depends(get_service_data_client),
    auth_service: AuthService = Depends(get_auth_service),
) -> SessionBootstrapResponse:
    return await auth_service.bootstrap_session(
        current_user=current_user,
        payload=payload,
        data_client=data_client,
        service_data_client=service_data_client,
    )
