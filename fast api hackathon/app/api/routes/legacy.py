from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user, require_roles
from app.auth.models import CurrentUser, UserRole
from app.db.supabase import SupabaseDataClient, get_request_data_client
from app.schemas.ai import AnalyzePatientResponse
from app.schemas.alerts import RecentAlertsResponse
from app.schemas.dashboard import DoctorDashboardResponse
from app.schemas.diagnosis import SimilarCasesRequest, SimilarCasesResponse
from app.schemas.me import MeResponse
from app.schemas.notes import NotesAnalyzeRequest, NotesAnalyzeResponse
from app.schemas.patient import PatientFullProfileResponse
from app.services.ai_service import AIService
from app.services.alert_service import AlertService
from app.services.dashboard_service import DashboardService
from app.services.dependencies import (
    get_ai_service,
    get_alert_service,
    get_dashboard_service,
    get_diagnosis_service,
    get_notes_service,
    get_patient_service,
)
from app.services.diagnosis_service import DiagnosisService
from app.services.notes_service import NotesService
from app.services.patient_service import PatientService

router = APIRouter(tags=["legacy"])


@router.get("/me", response_model=MeResponse)
async def legacy_me(current_user: CurrentUser = Depends(get_current_user)) -> MeResponse:
    return MeResponse(
        user_id=current_user.auth_user_id,
        profile_id=current_user.profile_id,
        patient_id=current_user.patient_id,
        vital_id=current_user.vital_id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        license_number=current_user.license_number,
        license_verified=current_user.license_verified,
    )


@router.get("/doctor/dashboard", response_model=DoctorDashboardResponse)
async def legacy_doctor_dashboard(
    current_user: CurrentUser = Depends(require_roles(UserRole.DOCTOR)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> DoctorDashboardResponse:
    return await dashboard_service.get_doctor_dashboard(
        current_user=current_user,
        data_client=data_client,
    )


@router.get("/patient/full-profile/{patient_id}", response_model=PatientFullProfileResponse)
async def legacy_full_profile(
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


@router.post("/patient/analyze/{patient_id}", response_model=AnalyzePatientResponse)
async def legacy_patient_analyze(
    patient_id: str,
    current_user: CurrentUser = Depends(require_roles(UserRole.DOCTOR)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    ai_service: AIService = Depends(get_ai_service),
) -> AnalyzePatientResponse:
    return await ai_service.analyze_patient(
        current_user=current_user,
        patient_id=patient_id,
        data_client=data_client,
    )


@router.get("/alerts/recent", response_model=RecentAlertsResponse)
async def legacy_alerts(
    current_user: CurrentUser = Depends(get_current_user),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    alert_service: AlertService = Depends(get_alert_service),
) -> RecentAlertsResponse:
    return await alert_service.get_recent_alerts(
        current_user=current_user,
        data_client=data_client,
    )


@router.post("/api/analyze/notes", response_model=NotesAnalyzeResponse)
async def legacy_notes_alias(
    payload: NotesAnalyzeRequest,
    current_user: CurrentUser = Depends(require_roles(UserRole.DOCTOR)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    notes_service: NotesService = Depends(get_notes_service),
) -> NotesAnalyzeResponse:
    return await notes_service.analyze_notes(
        current_user=current_user,
        data_client=data_client,
        payload=payload,
    )


@router.post("/api/cases/similar", response_model=SimilarCasesResponse)
async def legacy_cases_alias(
    payload: SimilarCasesRequest,
    current_user: CurrentUser = Depends(require_roles(UserRole.DOCTOR)),
    diagnosis_service: DiagnosisService = Depends(get_diagnosis_service),
) -> SimilarCasesResponse:
    return await diagnosis_service.find_similar_cases(payload=payload)
