import re

import httpx
from fastapi import HTTPException, status

from app.core.config import Settings


class PrescriptionStorageService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.base_url = f"{settings.supabase_url}/storage/v1"

    @property
    def bucket(self) -> str:
        return self.settings.prescription_storage_bucket

    @property
    def is_available(self) -> bool:
        return self.settings.has_prescription_storage

    def build_storage_path(
        self,
        *,
        patient_id: str,
        prescription_id: str,
        filename: str,
    ) -> str:
        safe_name = re.sub(r"[^A-Za-z0-9._-]+", "-", filename).strip("-") or "prescription"
        return f"patients/{patient_id}/{prescription_id}/{safe_name}"

    async def upload_document(
        self,
        *,
        storage_path: str,
        mime_type: str,
        content: bytes,
    ) -> None:
        if not self.is_available or not self.settings.supabase_service_role_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Prescription storage is not configured for this environment.",
            )

        try:
            async with httpx.AsyncClient(
                timeout=self.settings.request_timeout_seconds
            ) as client:
                response = await client.post(
                    f"{self.base_url}/object/{self.bucket}/{storage_path}",
                    headers={
                        "apikey": self.settings.supabase_service_role_key,
                        "Authorization": f"Bearer {self.settings.supabase_service_role_key}",
                        "Content-Type": mime_type,
                        "x-upsert": "false",
                    },
                    content=content,
                )
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Prescription storage upload failed: {exc}",
            ) from exc

        if response.is_success:
            return

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Prescription storage rejected the upload: {response.text}",
        )
