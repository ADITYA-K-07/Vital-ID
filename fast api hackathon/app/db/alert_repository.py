from typing import Any

from app.db.supabase import SupabaseDataClient


class AlertRepository:
    async def get_recent_alerts(
        self,
        data_client: SupabaseDataClient,
        *,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        return await data_client.select_rows(
            "alerts",
            columns="*",
            order_by="created_at",
            limit=limit,
        )

    async def get_patient_alerts(
        self,
        data_client: SupabaseDataClient,
        patient_id: str,
        *,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        return await data_client.select_rows(
            "alerts",
            columns="*",
            filters={"patient_id": f"eq.{patient_id}"},
            order_by="created_at",
            limit=limit,
        )

    async def create_alert(
        self,
        data_client: SupabaseDataClient,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        rows = await data_client.insert("alerts", payload=payload)
        return rows[0] if rows else None
