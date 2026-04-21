import json
import re
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import Settings
from app.schemas.diagnosis import SimilarCasesResponse
from app.schemas.forum import ForumCaseMatchResponse
from app.schemas.notes import NotesAnalyzeResponse
from app.schemas.patterns import PatternDetectResponse


class GroqClinicalAIProvider:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

    async def analyze_patient(self, patient_bundle: dict[str, Any]) -> dict[str, Any]:
        patient = patient_bundle.get("patient", {})
        records = patient_bundle.get("records", [])
        alerts = patient_bundle.get("alerts", [])
        prescriptions = patient_bundle.get("prescriptions", [])

        prompt = f"""
You are a medical AI assistant helping a clinician summarize patient risk.

Patient:
{json.dumps(patient, indent=2)}

Medical records:
{json.dumps(records, indent=2)}

Alerts:
{json.dumps(alerts, indent=2)}

Prescriptions:
{json.dumps(prescriptions, indent=2)}

Return only valid JSON with:
- summary: string
- risks: list of objects with title, severity, reason
- recommendations: list of strings
- urgency_level: one of low, medium, high, critical
"""
        payload = await self._complete_json(prompt=prompt)
        return {
            "patient_id": patient.get("id"),
            "summary": payload["summary"],
            "risks": payload["risks"],
            "recommendations": payload["recommendations"],
            "urgency_level": payload["urgency_level"],
            "timestamp": payload.get("timestamp") or patient_bundle.get("timestamp"),
            "source": f"groq:{self.settings.groq_model}",
            "stored_insight_id": None,
            "alert_created": False,
        }

    async def extract_prescription_structured_data(
        self,
        *,
        ocr_text: str,
        patient_context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        prompt = f"""
You are a medical AI assistant extracting structured data from OCR text for a patient-reviewed prescription workflow.

Patient context:
{json.dumps(patient_context or {}, indent=2)}

OCR text:
{ocr_text}

Return only valid JSON with this exact shape:
{{
  "medications": [
    {{
      "name": "Medication name",
      "dosage": "Optional dosage",
      "instructions": "Optional instructions"
    }}
  ],
  "treatments": [
    {{
      "text": "Treatment text candidate"
    }}
  ],
  "notes": [
    {{
      "text": "Doctor note text candidate"
    }}
  ],
  "follow_up": {{
    "title": "Optional title",
    "scheduled_date": "YYYY-MM-DD or null",
    "provider": "Optional provider"
  }},
  "warnings": ["Any ambiguity or low-confidence warnings"]
}}
If a section is missing, return an empty list or null for follow_up.
"""
        return await self._complete_json(prompt=prompt)

    async def analyze_notes(
        self,
        *,
        notes: str,
        patient_name: str | None = None,
    ) -> NotesAnalyzeResponse:
        context_line = f"Patient name: {patient_name}\n" if patient_name else ""
        prompt = f"""
You are a medical AI assistant. Analyze these doctor notes.

{context_line}Notes:
{notes}

Return only valid JSON with:
- symptoms: list of strings
- possible_conditions: list of strings
- suggested_next_steps: list of strings
- severity: one of low, medium, high
"""
        payload = await self._complete_json(prompt=prompt)
        return NotesAnalyzeResponse(**payload)

    async def detect_patterns(
        self,
        *,
        patient_name: str,
        records: list[dict[str, Any]],
    ) -> PatternDetectResponse:
        prompt = f"""
You are a medical AI. Analyze this patient's health history.

Patient name: {patient_name}
Records:
{json.dumps(records, indent=2)}

Return only valid JSON with:
- patterns: list of strings
- risk_flags: list of objects with flag and color where color is yellow or red
- recommendations: list of strings
- summary: string
"""
        payload = await self._complete_json(prompt=prompt)
        return PatternDetectResponse(**payload)

    async def find_similar_cases(
        self,
        *,
        symptoms: str,
        history: str,
        current_diagnosis: str,
    ) -> SimilarCasesResponse:
        prompt = f"""
You are a medical AI trained to suggest similar prior cases.

Symptoms:
{symptoms}

History:
{history}

Current diagnosis:
{current_diagnosis}

Return only valid JSON with:
- similar_cases: list of objects with case_id and description
- common_patterns: list of strings
- suggested_diagnosis: string
- confidence: integer from 0 to 100
- references: list of strings
"""
        payload = await self._complete_json(prompt=prompt)
        return SimilarCasesResponse(**payload)

    async def match_forum_case(
        self,
        *,
        title: str,
        specialty: str,
        description: str,
    ) -> ForumCaseMatchResponse:
        prompt = f"""
You are a medical AI assistant for a collaborative diagnosis platform.

A doctor has posted this case:
Title: {title}
Specialty: {specialty}
Description: {description}

Return only valid JSON in this exact shape:
{{
  "matched_doctors": [
    {{
      "name": "Dr. Full Name",
      "specialty": "Specialty",
      "hospital": "Hospital Name",
      "country": "Country",
      "reason": "Why this doctor is relevant to the case"
    }}
  ],
  "similar_cases": [
    {{
      "case_id": "CASE-XXXX",
      "title": "Case title",
      "specialty": "Specialty",
      "description": "Brief description of the case and patient presentation",
      "resolution": "Final diagnosis and how it was treated or resolved"
    }}
  ]
}}
"""
        payload = await self._complete_json(prompt=prompt)
        return ForumCaseMatchResponse(**payload)

    async def _complete_json(self, *, prompt: str) -> dict[str, Any]:
        if not self.settings.groq_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Groq mode is enabled but GROQ_API_KEY is not configured.",
            )

        body = {
            "model": self.settings.groq_model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
        }

        try:
            async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.settings.groq_api_key}",
                        "Content-Type": "application/json",
                    },
                    json=body,
                )
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Groq request failed: {exc}",
            ) from exc

        if not response.is_success:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Groq request rejected: {response.text}",
            )

        data = response.json()
        content = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
        )
        cleaned = self._extract_json_text(content)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Groq returned invalid JSON: {content}",
            ) from exc

    def _extract_json_text(self, content: str) -> str:
        stripped = content.strip()
        stripped = re.sub(r"^```json\s*", "", stripped, flags=re.IGNORECASE)
        stripped = re.sub(r"```$", "", stripped).strip()
        if stripped.startswith("{") and stripped.endswith("}"):
            return stripped

        start = stripped.find("{")
        end = stripped.rfind("}")
        if start != -1 and end != -1 and end > start:
            return stripped[start : end + 1]
        return stripped
