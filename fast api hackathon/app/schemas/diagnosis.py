from pydantic import BaseModel, Field


class SimilarCasesRequest(BaseModel):
    symptoms: str
    history: str
    current_diagnosis: str


class SimilarCaseItem(BaseModel):
    case_id: int
    description: str


class SimilarCasesResponse(BaseModel):
    similar_cases: list[SimilarCaseItem] = Field(default_factory=list)
    common_patterns: list[str] = Field(default_factory=list)
    suggested_diagnosis: str
    confidence: int
    references: list[str] = Field(default_factory=list)
