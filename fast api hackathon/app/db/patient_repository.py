from typing import Any

from app.db.supabase import SupabaseDataClient


class PatientRepository:
    async def get_patient_by_id(
        self,
        data_client: SupabaseDataClient,
        patient_id: str,
    ) -> dict[str, Any] | None:
        return await data_client.select_one(
            "patients",
            columns="*",
            filters={"id": f"eq.{patient_id}"},
        )

    async def get_patient_by_user_id(
        self,
        data_client: SupabaseDataClient,
        user_id: str,
    ) -> dict[str, Any] | None:
        return await data_client.select_one(
            "patients",
            columns="*",
            filters={"user_id": f"eq.{user_id}"},
        )

    async def list_patients(
        self,
        data_client: SupabaseDataClient,
        *,
        limit: int = 25,
    ) -> list[dict[str, Any]]:
        return await data_client.select_rows(
            "patients",
            columns="*",
            order_by="created_at",
            limit=limit,
        )

    async def get_medical_records(
        self,
        data_client: SupabaseDataClient,
        patient_id: str,
        *,
        limit: int = 25,
    ) -> list[dict[str, Any]]:
        return await data_client.select_rows(
            "medical_records",
            columns="*",
            filters={"patient_id": f"eq.{patient_id}"},
            order_by="visit_date",
            limit=limit,
        )

    async def create_medical_record(
        self,
        data_client: SupabaseDataClient,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        rows = await data_client.insert("medical_records", payload=payload)
        return rows[0] if rows else None

    async def update_patient(
        self,
        data_client: SupabaseDataClient,
        *,
        patient_id: str,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        rows = await data_client.update_rows(
            "patients",
            filters={"id": f"eq.{patient_id}"},
            payload=payload,
        )
        return rows[0] if rows else None

    async def list_restricted_records(
        self,
        data_client: SupabaseDataClient,
        patient_id: str,
        *,
        limit: int = 25,
    ) -> list[dict[str, Any]]:
        return await data_client.select_rows(
            "restricted_records",
            columns="*",
            filters={"patient_id": f"eq.{patient_id}"},
            order_by="created_at",
            limit=limit,
        )

    async def create_restricted_record(
        self,
        data_client: SupabaseDataClient,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        rows = await data_client.insert("restricted_records", payload=payload)
        return rows[0] if rows else None

    async def update_profile(
        self,
        data_client: SupabaseDataClient,
        *,
        profile_id: str,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        rows = await data_client.update_rows(
            "profiles",
            filters={"id": f"eq.{profile_id}"},
            payload=payload,
        )
        return rows[0] if rows else None

    async def upsert_profile(
        self,
        data_client: SupabaseDataClient,
        *,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        rows = await data_client.upsert(
            "profiles",
            payload=payload,
            on_conflict="id",
        )
        return rows[0] if rows else None

    async def list_patient_credentials(
        self,
        data_client: SupabaseDataClient,
        patient_id: str,
    ) -> list[dict[str, Any]]:
        # The current schema does not expose a dedicated credentials table yet.
        # Keep the route contract stable by returning an empty collection until
        # that table is added.
        return []

    async def list_prescriptions(
        self,
        data_client: SupabaseDataClient,
        patient_id: str,
        *,
        limit: int = 25,
    ) -> list[dict[str, Any]]:
        return await data_client.select_rows(
            "prescriptions",
            columns="*",
            filters={"patient_id": f"eq.{patient_id}"},
            order_by="created_at",
            limit=limit,
        )
