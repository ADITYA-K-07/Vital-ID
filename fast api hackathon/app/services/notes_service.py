from app.ai.provider import ClinicalAIProvider
from app.auth.models import CurrentUser
from app.db.supabase import SupabaseDataClient
from app.schemas.notes import NotesAnalyzeRequest, NotesAnalyzeResponse
from app.services.patient_service import PatientService


class NotesService:
    def __init__(
        self,
        provider: ClinicalAIProvider,
        patient_service: PatientService,
    ) -> None:
        self.provider = provider
        self.patient_service = patient_service

    async def analyze_notes(
        self,
        *,
        current_user: CurrentUser,
        data_client: SupabaseDataClient,
        payload: NotesAnalyzeRequest,
    ) -> NotesAnalyzeResponse:
        patient_name = payload.patient_name
        if payload.patient_id:
            bundle = await self.patient_service.load_patient_bundle(
                current_user=current_user,
                patient_id=payload.patient_id,
                data_client=data_client,
            )
            patient_name = bundle["profile"].get("full_name") or patient_name

        return await self.provider.analyze_notes(
            notes=payload.notes,
            patient_name=patient_name,
        )
