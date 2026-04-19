from enum import Enum
from typing import Any

from pydantic import BaseModel


class UserRole(str, Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"


class CurrentUser(BaseModel):
    auth_user_id: str
    profile_id: str
    patient_id: str | None = None
    name: str
    email: str
    role: UserRole
    access_token: str
    raw_claims: dict[str, Any]
