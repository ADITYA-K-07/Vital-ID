from enum import Enum

from pydantic import BaseModel, Field


class UrgencyLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RiskItem(BaseModel):
    title: str
    severity: UrgencyLevel
    reason: str


class StoredAIInsightItem(BaseModel):
    id: str
    patient_id: str
    summary: str
    risks: list[RiskItem] | list[dict] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    urgency_level: UrgencyLevel | str
    source: str | None = None
    kind: str | None = None
    created_at: str | None = None


class AnalyzePatientResponse(BaseModel):
    patient_id: str
    summary: str
    risks: list[RiskItem]
    recommendations: list[str]
    urgency_level: UrgencyLevel
    timestamp: str
    source: str
    stored_insight_id: str | None = None
    alert_created: bool = False
