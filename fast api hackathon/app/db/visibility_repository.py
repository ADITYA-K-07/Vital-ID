from typing import Any

from app.db.supabase import SupabaseDataClient


class VisibilityRepository:
    async def get_for_patient(
        self,
        data_client: SupabaseDataClient,
        *,
        patient_id: str,
    ) -> dict[str, Any] | None:
        return await data_client.select_one(
            "patient_visibility_settings",
            columns="*",
            filters={"patient_id": f"eq.{patient_id}"},
        )

    async def upsert_for_patient(
        self,
        data_client: SupabaseDataClient,
        *,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        rows = await data_client.upsert(
            "patient_visibility_settings",
            payload=payload,
            on_conflict="patient_id",
        )
        return rows[0] if rows else None
