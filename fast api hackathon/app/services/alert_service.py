from app.auth.models import CurrentUser
from app.db.alert_repository import AlertRepository
from app.db.supabase import SupabaseDataClient
from app.schemas.alerts import AlertItem, RecentAlertsResponse


class AlertService:
    def __init__(self, alert_repository: AlertRepository) -> None:
        self.alert_repository = alert_repository

    async def get_recent_alerts(
        self,
        *,
        current_user: CurrentUser,
        data_client: SupabaseDataClient,
    ) -> RecentAlertsResponse:
        if current_user.patient_id:
            rows = await self.alert_repository.get_patient_alerts(
                data_client=data_client,
                patient_id=current_user.patient_id,
                limit=10,
            )
        else:
            rows = await self.alert_repository.get_recent_alerts(data_client=data_client, limit=10)
        return RecentAlertsResponse(
            alerts=[self._shape_alert(row) for row in rows]
        )

    def _shape_alert(self, row: dict) -> AlertItem:
        priority = (row.get("priority") or row.get("severity") or "low").lower()
        status = row.get("status")
        if status is None:
            status = "read" if row.get("is_read") else "unread"

        return AlertItem(
            id=str(row["id"]),
            patient_id=row.get("patient_id"),
            title=row.get("title") or "Alert",
            message=row.get("description") or row.get("message") or "",
            severity=priority,
            status=status,
            created_at=row.get("created_at"),
            is_read=row.get("is_read"),
        )
