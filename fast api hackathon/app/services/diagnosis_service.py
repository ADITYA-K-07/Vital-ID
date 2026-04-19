from app.ai.provider import ClinicalAIProvider
from app.schemas.diagnosis import SimilarCasesRequest, SimilarCasesResponse


class DiagnosisService:
    def __init__(self, provider: ClinicalAIProvider) -> None:
        self.provider = provider

    async def find_similar_cases(
        self,
        *,
        payload: SimilarCasesRequest,
    ) -> SimilarCasesResponse:
        return await self.provider.find_similar_cases(
            symptoms=payload.symptoms,
            history=payload.history,
            current_diagnosis=payload.current_diagnosis,
        )
