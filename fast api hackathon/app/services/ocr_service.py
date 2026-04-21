from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import Settings


class OCRService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    @property
    def is_available(self) -> bool:
        return self.settings.has_ocr_api

    async def extract_text(
        self,
        *,
        filename: str,
        mime_type: str,
        content: bytes,
    ) -> dict[str, Any]:
        if not self.is_available or not self.settings.ocr_api_url:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Prescription OCR is not configured for this environment.",
            )

        headers = {}
        if self.settings.ocr_api_key:
            headers["Authorization"] = f"Bearer {self.settings.ocr_api_key}"

        try:
            async with httpx.AsyncClient(
                timeout=self.settings.request_timeout_seconds
            ) as client:
                response = await client.post(
                    self.settings.ocr_api_url,
                    headers=headers,
                    files={"file": (filename, content, mime_type)},
                )
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"OCR request failed: {exc}",
            ) from exc

        if not response.is_success:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"OCR request rejected: {response.text}",
            )

        payload = response.json()
        text = self._extract_text(payload)
        if not text:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="OCR response did not include any extracted text.",
            )

        warnings = payload.get("warnings") or payload.get("messages") or []
        if not isinstance(warnings, list):
            warnings = [str(warnings)]

        confidence = payload.get("confidence")
        if confidence is not None:
            try:
                confidence = float(confidence)
            except (TypeError, ValueError):
                confidence = None

        return {
            "raw_text": text,
            "warnings": [str(item).strip() for item in warnings if str(item).strip()],
            "confidence": confidence,
        }

    def _extract_text(self, payload: Any) -> str:
        if isinstance(payload, dict):
            for key in ("raw_text", "text", "content"):
                value = payload.get(key)
                if isinstance(value, str) and value.strip():
                    return value.strip()

            lines = payload.get("lines")
            if isinstance(lines, list):
                flattened = [str(item).strip() for item in lines if str(item).strip()]
                if flattened:
                    return "\n".join(flattened)

            pages = payload.get("pages")
            if isinstance(pages, list):
                page_texts: list[str] = []
                for page in pages:
                    if isinstance(page, dict):
                        value = page.get("text")
                        if isinstance(value, str) and value.strip():
                            page_texts.append(value.strip())
                if page_texts:
                    return "\n\n".join(page_texts)

        if isinstance(payload, str):
            return payload.strip()
        return ""
