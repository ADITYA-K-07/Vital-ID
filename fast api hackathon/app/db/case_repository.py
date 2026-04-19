from typing import Any

from app.db.supabase import SupabaseDataClient


class CaseRepository:
    async def list_cases(
        self,
        data_client: SupabaseDataClient,
        *,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        return await data_client.select_rows(
            "cases",
            columns="*",
            order_by="created_at",
            limit=limit,
        )

    async def get_case_by_id(
        self,
        data_client: SupabaseDataClient,
        case_id: str,
    ) -> dict[str, Any] | None:
        return await data_client.select_one(
            "cases",
            columns="*",
            filters={"id": f"eq.{case_id}"},
        )

    async def create_case(
        self,
        data_client: SupabaseDataClient,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        rows = await data_client.insert("cases", payload=payload)
        return rows[0] if rows else None
