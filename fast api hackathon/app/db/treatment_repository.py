from typing import Any

from app.db.supabase import SupabaseDataClient


class TreatmentRepository:
    async def list_for_patient(
        self,
        data_client: SupabaseDataClient,
        *,
        patient_id: str,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        return await data_client.select_rows(
            "treatment_history",
            columns="*",
            filters={"patient_id": f"eq.{patient_id}"},
            order_by="created_at",
            limit=limit,
        )

    async def get_by_id(
        self,
        data_client: SupabaseDataClient,
        *,
        treatment_id: str,
    ) -> dict[str, Any] | None:
        return await data_client.select_one(
            "treatment_history",
            columns="*",
            filters={"id": f"eq.{treatment_id}"},
        )

    async def create_entry(
        self,
        data_client: SupabaseDataClient,
        *,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        rows = await data_client.insert("treatment_history", payload=payload)
        return rows[0] if rows else None

    async def delete_entry(
        self,
        data_client: SupabaseDataClient,
        *,
        treatment_id: str,
    ) -> dict[str, Any] | None:
        rows = await data_client.delete_rows(
            "treatment_history",
            filters={"id": f"eq.{treatment_id}"},
        )
        return rows[0] if rows else None
