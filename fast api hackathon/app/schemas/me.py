from pydantic import BaseModel

from app.auth.models import UserRole


class MeResponse(BaseModel):
    user_id: str
    profile_id: str
    patient_id: str | None = None
    vital_id: str | None = None
    name: str
    email: str
    role: UserRole
    license_number: str | None = None
    license_verified: bool = False
