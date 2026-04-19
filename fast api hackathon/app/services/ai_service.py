from app.ai.provider import ClinicalAIProvider
from app.auth.models import CurrentUser
from app.core.config import Settings
from app.db.alert_repository import AlertRepository
from app.db.insight_repository import InsightRepository
from app.db.supabase import SupabaseDataClient
from app.schemas.ai import AnalyzePatientResponse, UrgencyLevel
from app.services.patient_service import PatientService
from app.utils.datetime import utc_now_iso


class AIService:
    def __init__(
        self,
        patient_service: PatientService,
        insight_repository: InsightRepository,
        alert_repository: AlertRepository,
        provider: ClinicalAIProvider,
        settings: Settings,
    ) -> None:
        self.patient_service = patient_service
        self.insight_repository = insight_repository
        self.alert_repository = alert_repository
        self.provider = provider
        self.settings = settings

    async def analyze_patient(
        self,
        *,
        current_user: CurrentUser,
        patient_id: str,
        data_client: SupabaseDataClient,
    ) -> AnalyzePatientResponse:
        patient_bundle = await self.patient_service.load_patient_bundle(
            current_user=current_user,
            patient_id=patient_id,
            data_client=data_client,
        )

        analysis = await self.provider.analyze_patient(patient_bundle)
        if not analysis.get("timestamp"):
            analysis["timestamp"] = utc_now_iso()

        stored_insight = None
        if self.settings.ai_insight_store_enabled:
            stored_insight = await self.insight_repository.create_insight(
                data_client=data_client,
                payload={
                    "patient_id": patient_id,
                    "insight": analysis["summary"],
                    "type": "patient_analysis",
                    "payload": {
                        "summary": analysis["summary"],
                        "risks": analysis["risks"],
                        "recommendations": analysis["recommendations"],
                        "urgency_level": analysis["urgency_level"],
                    },
                    "doctor_id": current_user.profile_id,
                    "source": analysis["source"],
                },
            )

        alert_created = False
        if self.settings.ai_create_alerts_enabled and analysis["urgency_level"] in {
            UrgencyLevel.HIGH.value,
            UrgencyLevel.CRITICAL.value,
        }:
            alert = await self.alert_repository.create_alert(
                data_client=data_client,
                payload={
                    "patient_id": patient_id,
                    "title": "AI follow-up recommended",
                    "description": analysis["summary"],
                    "priority": "high" if analysis["urgency_level"] == UrgencyLevel.CRITICAL.value else analysis["urgency_level"],
                    "is_read": False,
                },
            )
            alert_created = alert is not None

        analysis["stored_insight_id"] = stored_insight["id"] if stored_insight else None
        analysis["alert_created"] = alert_created
        return AnalyzePatientResponse(**analysis)
