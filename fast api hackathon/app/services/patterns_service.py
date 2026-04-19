from app.ai.provider import ClinicalAIProvider
from app.auth.models import CurrentUser
from app.core.config import Settings
from app.db.insight_repository import InsightRepository
from app.db.supabase import SupabaseDataClient
from app.schemas.patterns import PatternDetectRequest, PatternDetectResponse


class PatternsService:
    def __init__(
        self,
        provider: ClinicalAIProvider,
        insight_repository: InsightRepository,
        settings: Settings,
    ) -> None:
        self.provider = provider
        self.insight_repository = insight_repository
        self.settings = settings

    async def detect_patterns(
        self,
        *,
        current_user: CurrentUser,
        data_client: SupabaseDataClient,
        payload: PatternDetectRequest,
    ) -> PatternDetectResponse:
        result = await self.provider.detect_patterns(
            patient_name=payload.patient_name,
            records=[record.model_dump() for record in payload.records],
        )

        if self.settings.ai_insight_store_enabled and payload.patient_id:
            await self.insight_repository.create_insight(
                data_client=data_client,
                payload={
                    "patient_id": payload.patient_id,
                    "insight": result.summary,
                    "type": "pattern_detection",
                    "payload": result.model_dump(mode="json"),
                    "doctor_id": current_user.profile_id,
                    "source": "patterns",
                },
            )

        return result
