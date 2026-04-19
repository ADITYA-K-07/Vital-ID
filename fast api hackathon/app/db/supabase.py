from typing import Any

import httpx
from fastapi import Depends, HTTPException, status

from app.auth.security import get_access_token
from app.core.config import Settings, get_settings


class SupabaseAuthGateway:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.auth_url = f"{settings.supabase_url}/auth/v1"

    async def get_user(self, access_token: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.get(
                f"{self.auth_url}/user",
                headers={
                    "apikey": self.settings.supabase_anon_key,
                    "Authorization": f"Bearer {access_token}",
                },
            )

        if response.status_code == status.HTTP_200_OK:
            return response.json()

        detail = _extract_error_detail(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Supabase token validation failed: {detail}",
        )


class SupabaseDataClient:
    def __init__(self, settings: Settings, access_token: str) -> None:
        self.settings = settings
        self.base_url = f"{settings.supabase_url}/rest/v1"
        self.access_token = access_token
        self.default_headers = {
            "apikey": settings.supabase_anon_key,
            "Authorization": f"Bearer {access_token}",
            "Accept-Profile": settings.supabase_schema,
            "Content-Profile": settings.supabase_schema,
        }

    async def select_rows(
        self,
        table: str,
        *,
        columns: str = "*",
        filters: dict[str, str] | None = None,
        order_by: str | None = None,
        descending: bool = True,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        params: dict[str, str | int] = {"select": columns}
        if filters:
            params.update(filters)
        if order_by:
            direction = "desc" if descending else "asc"
            params["order"] = f"{order_by}.{direction}"
        if limit is not None:
            params["limit"] = limit

        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.get(
                f"{self.base_url}/{table}",
                headers=self.default_headers,
                params=params,
            )

        self._raise_for_status(response)
        payload = response.json()
        return payload if isinstance(payload, list) else []

    async def select_one(
        self,
        table: str,
        *,
        columns: str = "*",
        filters: dict[str, str] | None = None,
        order_by: str | None = None,
        descending: bool = True,
    ) -> dict[str, Any] | None:
        rows = await self.select_rows(
            table,
            columns=columns,
            filters=filters,
            order_by=order_by,
            descending=descending,
            limit=1,
        )
        return rows[0] if rows else None

    async def insert(
        self,
        table: str,
        *,
        payload: dict[str, Any] | list[dict[str, Any]],
        returning: str = "representation",
    ) -> list[dict[str, Any]]:
        headers = {
            **self.default_headers,
            "Prefer": f"return={returning}",
        }
        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.post(
                f"{self.base_url}/{table}",
                headers=headers,
                json=payload,
            )

        self._raise_for_status(response)
        data = response.json()
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            return [data]
        return []

    async def upsert(
        self,
        table: str,
        *,
        payload: dict[str, Any] | list[dict[str, Any]],
        on_conflict: str | None = None,
        returning: str = "representation",
    ) -> list[dict[str, Any]]:
        headers = {
            **self.default_headers,
            "Prefer": f"resolution=merge-duplicates,return={returning}",
        }
        params: dict[str, str] = {}
        if on_conflict:
            params["on_conflict"] = on_conflict

        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.post(
                f"{self.base_url}/{table}",
                headers=headers,
                params=params,
                json=payload,
            )

        self._raise_for_status(response)
        data = response.json()
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            return [data]
        return []

    async def update_rows(
        self,
        table: str,
        *,
        filters: dict[str, str],
        payload: dict[str, Any],
        returning: str = "representation",
    ) -> list[dict[str, Any]]:
        headers = {
            **self.default_headers,
            "Prefer": f"return={returning}",
        }
        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.patch(
                f"{self.base_url}/{table}",
                headers=headers,
                params=filters,
                json=payload,
            )

        self._raise_for_status(response)
        data = response.json()
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            return [data]
        return []

    def _raise_for_status(self, response: httpx.Response) -> None:
        if response.is_success:
            return

        detail = _extract_error_detail(response)
        if response.status_code in {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN}:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Supabase RLS or auth rejected the request: {detail}",
            )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Supabase data request failed: {detail}",
        )


def _extract_error_detail(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return response.text or response.reason_phrase

    if isinstance(payload, dict):
        return (
            payload.get("msg")
            or payload.get("message")
            or payload.get("error_description")
            or payload.get("error")
            or response.reason_phrase
        )
    return response.text or response.reason_phrase


def get_supabase_auth_gateway(
    settings: Settings = Depends(get_settings),
) -> SupabaseAuthGateway:
    return SupabaseAuthGateway(settings=settings)


def get_request_data_client(
    access_token: str = Depends(get_access_token),
    settings: Settings = Depends(get_settings),
) -> SupabaseDataClient:
    return SupabaseDataClient(settings=settings, access_token=access_token)
