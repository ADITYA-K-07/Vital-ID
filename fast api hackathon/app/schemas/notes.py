from typing import Literal

from pydantic import BaseModel, Field


class NotesAnalyzeRequest(BaseModel):
    notes: str
    patient_id: str | None = None
    patient_name: str | None = None


class NotesAnalyzeResponse(BaseModel):
    symptoms: list[str] = Field(default_factory=list)
    possible_conditions: list[str] = Field(default_factory=list)
    suggested_next_steps: list[str] = Field(default_factory=list)
    severity: Literal["low", "medium", "high"]
