from enum import Enum

from pydantic import BaseModel


class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertItem(BaseModel):
    id: str
    patient_id: str | None = None
    title: str
    message: str
    severity: AlertSeverity | str
    status: str | None = None
    created_at: str | None = None
    is_read: bool | None = None


class RecentAlertsResponse(BaseModel):
    alerts: list[AlertItem]
