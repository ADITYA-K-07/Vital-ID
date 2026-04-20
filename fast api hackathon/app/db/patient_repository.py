from typing import Any

from app.db.supabase import SupabaseDataClient


class PatientRepository:
    def _normalize_identifier(self, identifier: str) -> str:
        return identifier.strip()

    def _normalize_vital_id(self, identifier: str) -> str:
        compact = "".join(identifier.split()).upper()

        if compact.startswith("VID") and len(compact) > 3 and compact[3] != "-":
            compact = f"VID-{compact[3:]}"

        return compact

    async def get_patient_by_vital_id(
        self,
        data_client: SupabaseDataClient,
        vital_id: str,
    ) -> dict[str, Any] | None:
        return await data_client.select_one(
            "patients",
            columns="*",
            filters={"vital_id": f"eq.{vital_id}"},
        )

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

    async def create_patient(
        self,
        data_client: SupabaseDataClient,
        *,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        rows = await data_client.insert("patients", payload=payload)
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

    async def find_patient_by_identifier(
        self,
        data_client: SupabaseDataClient,
        *,
        identifier: str,
    ) -> dict[str, Any] | None:
        normalized_identifier = self._normalize_identifier(identifier)
        if not normalized_identifier:
            return None

        patient = await self.get_patient_by_vital_id(
            data_client=data_client,
            vital_id=normalized_identifier,
        )
        if patient:
            return patient

        canonical_vital_id = self._normalize_vital_id(normalized_identifier)
        if canonical_vital_id != normalized_identifier:
            patient = await self.get_patient_by_vital_id(
                data_client=data_client,
                vital_id=canonical_vital_id,
            )
            if patient:
                return patient

        return await self.get_patient_by_id(
            data_client=data_client,
            patient_id=normalized_identifier,
        )

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
