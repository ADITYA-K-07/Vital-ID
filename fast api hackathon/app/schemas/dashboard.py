from pydantic import BaseModel, Field

from app.schemas.ai import StoredAIInsightItem
from app.schemas.alerts import AlertItem


class DoctorInfo(BaseModel):
    id: str
    auth_user_id: str
    name: str
    email: str


class PatientLookupItem(BaseModel):
    id: str
    user_id: str | None = None
    full_name: str
    age: int | None = None
    blood_group: str | None = None
    created_at: str | None = None


class DoctorDashboardResponse(BaseModel):
    doctor: DoctorInfo
    patients: list[PatientLookupItem] = Field(default_factory=list)
    recent_alerts: list[AlertItem] = Field(default_factory=list)
    recent_ai_insights: list[StoredAIInsightItem] = Field(default_factory=list)
