from typing import Any

from app.db.supabase import SupabaseDataClient


class MedicalHistoryRepository:
    async def list_for_patient(
        self,
        data_client: SupabaseDataClient,
        *,
        patient_id: str,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        return await data_client.select_rows(
            "medical_history",
            columns="*",
            filters={"patient_id": f"eq.{patient_id}"},
            order_by="event_date",
            limit=limit,
        )

    async def get_by_id(
        self,
        data_client: SupabaseDataClient,
        *,
        history_id: str,
    ) -> dict[str, Any] | None:
        return await data_client.select_one(
            "medical_history",
            columns="*",
            filters={"id": f"eq.{history_id}"},
        )

    async def create_entry(
        self,
        data_client: SupabaseDataClient,
        *,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        rows = await data_client.insert("medical_history", payload=payload)
        return rows[0] if rows else None

    async def delete_entry(
        self,
        data_client: SupabaseDataClient,
        *,
        history_id: str,
    ) -> dict[str, Any] | None:
        rows = await data_client.delete_rows(
            "medical_history",
            filters={"id": f"eq.{history_id}"},
        )
        return rows[0] if rows else None
