from typing import Literal

from pydantic import BaseModel, Field


class PatternRecordInput(BaseModel):
    date: str
    condition: str
    notes: str


class PatternDetectRequest(BaseModel):
    patient_id: str | None = None
    patient_name: str
    records: list[PatternRecordInput]


class RiskFlag(BaseModel):
    flag: str
    color: Literal["yellow", "red"]


class PatternDetectResponse(BaseModel):
    patterns: list[str] = Field(default_factory=list)
    risk_flags: list[RiskFlag] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    summary: str
