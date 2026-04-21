from typing import Any

from app.db.supabase import SupabaseDataClient


class ConsultationRepository:
    async def list_for_patient(
        self,
        data_client: SupabaseDataClient,
        *,
        patient_id: str,
        limit: int = 25,
    ) -> list[dict[str, Any]]:
        return await data_client.select_rows(
            "consultations",
            columns="*",
            filters={"patient_id": f"eq.{patient_id}"},
            order_by="scheduled_at",
            descending=False,
            limit=limit,
        )

    async def create_entry(
        self,
        data_client: SupabaseDataClient,
        *,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        rows = await data_client.insert("consultations", payload=payload)
        return rows[0] if rows else None
