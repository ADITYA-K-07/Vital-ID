from typing import Any

from app.db.supabase import SupabaseDataClient


class InsightRepository:
    async def get_recent_insights(
        self,
        data_client: SupabaseDataClient,
        *,
        patient_id: str | None = None,
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        filters = {"patient_id": f"eq.{patient_id}"} if patient_id else None
        return await data_client.select_rows(
            "ai_insights",
            columns="*",
            filters=filters,
            order_by="created_at",
            limit=limit,
        )

    async def create_insight(
        self,
        data_client: SupabaseDataClient,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        rows = await data_client.insert("ai_insights", payload=payload)
        return rows[0] if rows else None
