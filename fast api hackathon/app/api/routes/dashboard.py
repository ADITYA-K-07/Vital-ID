from fastapi import APIRouter, Depends

from app.auth.dependencies import require_roles
from app.auth.models import CurrentUser, UserRole
from app.db.supabase import SupabaseDataClient, get_request_data_client
from app.schemas.dashboard import DoctorDashboardResponse
from app.schemas.patient import PatientDashboardResponse
from app.services.dashboard_service import DashboardService
from app.services.dependencies import get_dashboard_service

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/doctor", response_model=DoctorDashboardResponse)
async def get_doctor_dashboard(
    current_user: CurrentUser = Depends(require_roles(UserRole.DOCTOR)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> DoctorDashboardResponse:
    return await dashboard_service.get_doctor_dashboard(
        current_user=current_user,
        data_client=data_client,
    )


@router.get("/dashboard/patient", response_model=PatientDashboardResponse)
async def get_patient_dashboard(
    current_user: CurrentUser = Depends(require_roles(UserRole.PATIENT)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> PatientDashboardResponse:
    return await dashboard_service.get_patient_dashboard(
        current_user=current_user,
        data_client=data_client,
    )
