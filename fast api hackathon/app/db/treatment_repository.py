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
