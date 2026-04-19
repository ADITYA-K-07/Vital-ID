from typing import Any

from app.db.supabase import SupabaseDataClient


class CommentRepository:
    async def list_comments(
        self,
        data_client: SupabaseDataClient,
        *,
        case_id: str,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        return await data_client.select_rows(
            "comments",
            columns="*",
            filters={"case_id": f"eq.{case_id}"},
            order_by="created_at",
            limit=limit,
        )

    async def create_comment(
        self,
        data_client: SupabaseDataClient,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        rows = await data_client.insert("comments", payload=payload)
        return rows[0] if rows else None
