from typing import Any

from app.db.supabase import SupabaseDataClient


class UserRepository:
    async def get_profile_by_auth_user_id(
        self,
        data_client: SupabaseDataClient,
        auth_user_id: str,
    ) -> dict[str, Any] | None:
        return await data_client.select_one(
            "profiles",
            columns="*",
            filters={"id": f"eq.{auth_user_id}"},
        )

    async def get_profile_by_id(
        self,
        data_client: SupabaseDataClient,
        profile_id: str,
    ) -> dict[str, Any] | None:
        return await data_client.select_one(
            "profiles",
            columns="*",
            filters={"id": f"eq.{profile_id}"},
        )

    async def get_profiles_by_ids(
        self,
        data_client: SupabaseDataClient,
        profile_ids: list[str],
    ) -> list[dict[str, Any]]:
        if not profile_ids:
            return []
        unique_ids = sorted(set(profile_ids))
        filters = {"id": f"in.({','.join(unique_ids)})"}
        return await data_client.select_rows("profiles", columns="*", filters=filters, limit=len(unique_ids))
