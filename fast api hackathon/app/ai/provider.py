from typing import Any, Protocol

from app.schemas.diagnosis import SimilarCasesResponse
from app.schemas.forum import ForumCaseMatchResponse
from app.schemas.notes import NotesAnalyzeResponse
from app.schemas.patterns import PatternDetectResponse


class ClinicalAIProvider(Protocol):
    async def analyze_patient(self, patient_bundle: dict[str, Any]) -> dict[str, Any]:
        ...

    async def analyze_notes(
        self,
        *,
        notes: str,
        patient_name: str | None = None,
    ) -> NotesAnalyzeResponse:
        ...

    async def detect_patterns(
        self,
        *,
        patient_name: str,
        records: list[dict[str, Any]],
    ) -> PatternDetectResponse:
        ...

    async def find_similar_cases(
        self,
        *,
        symptoms: str,
        history: str,
        current_diagnosis: str,
    ) -> SimilarCasesResponse:
        ...

    async def match_forum_case(
        self,
        *,
        title: str,
        specialty: str,
        description: str,
    ) -> ForumCaseMatchResponse:
        ...
