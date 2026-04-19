import asyncio

from app.auth.models import CurrentUser
from app.db.alert_repository import AlertRepository
from app.db.insight_repository import InsightRepository
from app.db.patient_repository import PatientRepository
from app.db.supabase import SupabaseDataClient
from app.db.user_repository import UserRepository
from app.schemas.ai import RiskItem, StoredAIInsightItem
from app.schemas.alerts import AlertItem
from app.schemas.dashboard import DoctorDashboardResponse, DoctorInfo, PatientLookupItem
from app.schemas.patient import PatientIdentityResponse
from app.services.patient_service import PatientService


class DashboardService:
    def __init__(
        self,
        user_repository: UserRepository,
        patient_repository: PatientRepository,
        alert_repository: AlertRepository,
        insight_repository: InsightRepository,
        patient_service: PatientService,
    ) -> None:
        self.user_repository = user_repository
        self.patient_repository = patient_repository
        self.alert_repository = alert_repository
        self.insight_repository = insight_repository
        self.patient_service = patient_service

    async def get_doctor_dashboard(
        self,
        *,
        current_user: CurrentUser,
        data_client: SupabaseDataClient,
    ) -> DoctorDashboardResponse:
        patient_rows, recent_alerts, recent_insights = await asyncio.gather(
            self.patient_repository.list_patients(data_client=data_client, limit=20),
            self.alert_repository.get_recent_alerts(data_client=data_client, limit=5),
            self.insight_repository.get_recent_insights(data_client=data_client, limit=5),
        )

        profiles = await self.user_repository.get_profiles_by_ids(
            data_client=data_client,
            profile_ids=[row.get("user_id") for row in patient_rows if row.get("user_id")],
        )
        profile_map = {profile["id"]: profile for profile in profiles}

        return DoctorDashboardResponse(
            doctor=DoctorInfo(
                id=current_user.profile_id,
                auth_user_id=current_user.auth_user_id,
                name=current_user.name,
                email=current_user.email,
            ),
            patients=[
                PatientLookupItem(
                    id=str(row["id"]),
                    user_id=row.get("user_id"),
                    full_name=(profile_map.get(row.get("user_id"), {}) or {}).get("full_name") or "Unknown patient",
                    age=row.get("age"),
                    blood_group=row.get("blood_group"),
                    created_at=row.get("created_at"),
                )
                for row in patient_rows
            ],
            recent_alerts=[self._shape_alert(row) for row in recent_alerts],
            recent_ai_insights=[self._shape_insight(row) for row in recent_insights],
        )

    async def get_patient_dashboard(
        self,
        *,
        current_user: CurrentUser,
        data_client: SupabaseDataClient,
    ) -> PatientIdentityResponse:
        return await self.patient_service.get_my_identity(
            current_user=current_user,
            data_client=data_client,
        )

    def _shape_alert(self, row: dict) -> AlertItem:
        severity = (row.get("priority") or row.get("severity") or "low").lower()
        status = row.get("status") or ("read" if row.get("is_read") else "unread")
        return AlertItem(
            id=str(row["id"]),
            patient_id=row.get("patient_id"),
            title=row.get("title") or "Alert",
            message=row.get("description") or row.get("message") or "",
            severity=severity,
            status=status,
            created_at=row.get("created_at"),
            is_read=row.get("is_read"),
        )

    def _shape_insight(self, row: dict) -> StoredAIInsightItem:
        payload = row.get("payload") if isinstance(row.get("payload"), dict) else {}
        raw_risks = payload.get("risks") or []
        risks = [
            risk if isinstance(risk, RiskItem) else RiskItem(**risk)
            for risk in raw_risks
            if isinstance(risk, dict)
        ]
        return StoredAIInsightItem(
            id=str(row["id"]),
            patient_id=row.get("patient_id") or "",
            summary=payload.get("summary") or row.get("insight") or "",
            risks=risks,
            recommendations=payload.get("recommendations") or [],
            urgency_level=payload.get("urgency_level") or "low",
            source=row.get("source") or row.get("type"),
            kind=row.get("type"),
            created_at=row.get("created_at"),
        )
