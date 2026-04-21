from fastapi import Depends

from app.ai.groq_provider import GroqClinicalAIProvider
from app.ai.mock_provider import MockClinicalAIProvider
from app.ai.provider import ClinicalAIProvider
from app.core.config import Settings, get_settings
from app.db.alert_repository import AlertRepository
from app.db.case_repository import CaseRepository
from app.db.comment_repository import CommentRepository
from app.db.consultation_repository import ConsultationRepository
from app.db.insight_repository import InsightRepository
from app.db.medical_history_repository import MedicalHistoryRepository
from app.db.patient_repository import PatientRepository
from app.db.supabase import SupabaseAuthGateway, get_supabase_auth_gateway
from app.db.treatment_repository import TreatmentRepository
from app.db.user_repository import UserRepository
from app.db.visibility_repository import VisibilityRepository
from app.services.ai_service import AIService
from app.services.alert_service import AlertService
from app.services.auth_service import AuthService
from app.services.dashboard_service import DashboardService
from app.services.diagnosis_service import DiagnosisService
from app.services.forum_service import ForumService
from app.services.notes_service import NotesService
from app.services.ocr_service import OCRService
from app.services.patient_service import PatientService
from app.services.patterns_service import PatternsService
from app.services.prescription_storage_service import PrescriptionStorageService


def get_user_repository() -> UserRepository:
    return UserRepository()


def get_patient_repository() -> PatientRepository:
    return PatientRepository()


def get_alert_repository() -> AlertRepository:
    return AlertRepository()


def get_insight_repository() -> InsightRepository:
    return InsightRepository()


def get_case_repository() -> CaseRepository:
    return CaseRepository()


def get_comment_repository() -> CommentRepository:
    return CommentRepository()


def get_consultation_repository() -> ConsultationRepository:
    return ConsultationRepository()


def get_treatment_repository() -> TreatmentRepository:
    return TreatmentRepository()


def get_medical_history_repository() -> MedicalHistoryRepository:
    return MedicalHistoryRepository()


def get_visibility_repository() -> VisibilityRepository:
    return VisibilityRepository()


def get_ocr_service(
    settings: Settings = Depends(get_settings),
) -> OCRService:
    return OCRService(settings=settings)


def get_prescription_storage_service(
    settings: Settings = Depends(get_settings),
) -> PrescriptionStorageService:
    return PrescriptionStorageService(settings=settings)


def get_clinical_ai_provider(
    settings: Settings = Depends(get_settings),
) -> ClinicalAIProvider:
    if settings.is_groq_ai and settings.groq_api_key:
        return GroqClinicalAIProvider(settings=settings)
    return MockClinicalAIProvider()


def get_auth_service(
    auth_gateway: SupabaseAuthGateway = Depends(get_supabase_auth_gateway),
    user_repository: UserRepository = Depends(get_user_repository),
    patient_repository: PatientRepository = Depends(get_patient_repository),
) -> AuthService:
    return AuthService(
        auth_gateway=auth_gateway,
        user_repository=user_repository,
        patient_repository=patient_repository,
    )


def get_patient_service(
    user_repository: UserRepository = Depends(get_user_repository),
    patient_repository: PatientRepository = Depends(get_patient_repository),
    alert_repository: AlertRepository = Depends(get_alert_repository),
    insight_repository: InsightRepository = Depends(get_insight_repository),
    consultation_repository: ConsultationRepository = Depends(get_consultation_repository),
    treatment_repository: TreatmentRepository = Depends(get_treatment_repository),
    medical_history_repository: MedicalHistoryRepository = Depends(get_medical_history_repository),
    visibility_repository: VisibilityRepository = Depends(get_visibility_repository),
    provider: ClinicalAIProvider = Depends(get_clinical_ai_provider),
    settings: Settings = Depends(get_settings),
    ocr_service: OCRService = Depends(get_ocr_service),
    prescription_storage_service: PrescriptionStorageService = Depends(get_prescription_storage_service),
) -> PatientService:
    return PatientService(
        user_repository=user_repository,
        patient_repository=patient_repository,
        alert_repository=alert_repository,
        insight_repository=insight_repository,
        consultation_repository=consultation_repository,
        treatment_repository=treatment_repository,
        medical_history_repository=medical_history_repository,
        visibility_repository=visibility_repository,
        provider=provider,
        settings=settings,
        ocr_service=ocr_service,
        prescription_storage_service=prescription_storage_service,
    )


def get_dashboard_service(
    user_repository: UserRepository = Depends(get_user_repository),
    patient_repository: PatientRepository = Depends(get_patient_repository),
    alert_repository: AlertRepository = Depends(get_alert_repository),
    insight_repository: InsightRepository = Depends(get_insight_repository),
    patient_service: PatientService = Depends(get_patient_service),
) -> DashboardService:
    return DashboardService(
        user_repository=user_repository,
        patient_repository=patient_repository,
        alert_repository=alert_repository,
        insight_repository=insight_repository,
        patient_service=patient_service,
    )


def get_alert_service(
    alert_repository: AlertRepository = Depends(get_alert_repository),
) -> AlertService:
    return AlertService(alert_repository=alert_repository)


def get_ai_service(
    patient_service: PatientService = Depends(get_patient_service),
    insight_repository: InsightRepository = Depends(get_insight_repository),
    alert_repository: AlertRepository = Depends(get_alert_repository),
    provider: ClinicalAIProvider = Depends(get_clinical_ai_provider),
    settings: Settings = Depends(get_settings),
) -> AIService:
    return AIService(
        patient_service=patient_service,
        insight_repository=insight_repository,
        alert_repository=alert_repository,
        provider=provider,
        settings=settings,
    )


def get_notes_service(
    provider: ClinicalAIProvider = Depends(get_clinical_ai_provider),
    patient_service: PatientService = Depends(get_patient_service),
) -> NotesService:
    return NotesService(provider=provider, patient_service=patient_service)


def get_patterns_service(
    provider: ClinicalAIProvider = Depends(get_clinical_ai_provider),
    insight_repository: InsightRepository = Depends(get_insight_repository),
    settings: Settings = Depends(get_settings),
) -> PatternsService:
    return PatternsService(
        provider=provider,
        insight_repository=insight_repository,
        settings=settings,
    )


def get_diagnosis_service(
    provider: ClinicalAIProvider = Depends(get_clinical_ai_provider),
) -> DiagnosisService:
    return DiagnosisService(provider=provider)


def get_forum_service(
    case_repository: CaseRepository = Depends(get_case_repository),
    comment_repository: CommentRepository = Depends(get_comment_repository),
    user_repository: UserRepository = Depends(get_user_repository),
    provider: ClinicalAIProvider = Depends(get_clinical_ai_provider),
) -> ForumService:
    return ForumService(
        case_repository=case_repository,
        comment_repository=comment_repository,
        user_repository=user_repository,
        provider=provider,
    )
