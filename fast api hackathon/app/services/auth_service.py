from fastapi import HTTPException, status

from app.auth.models import CurrentUser, UserRole
from app.db.supabase import SupabaseAuthGateway, SupabaseDataClient
from app.db.patient_repository import PatientRepository
from app.db.user_repository import UserRepository


class AuthService:
    def __init__(
        self,
        auth_gateway: SupabaseAuthGateway,
        user_repository: UserRepository,
        patient_repository: PatientRepository,
    ) -> None:
        self.auth_gateway = auth_gateway
        self.user_repository = user_repository
        self.patient_repository = patient_repository

    async def authenticate(self, *, access_token: str, data_client: SupabaseDataClient) -> CurrentUser:
        auth_user = await self.auth_gateway.get_user(access_token)
        profile = await self.user_repository.get_profile_by_auth_user_id(
            data_client=data_client,
            auth_user_id=auth_user["id"],
        )

        if not profile:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Authenticated user does not have an application profile row.",
            )

        role_value = (
            profile.get("role")
            or (auth_user.get("app_metadata") or {}).get("role")
            or ""
        ).lower()
        if role_value not in {UserRole.PATIENT.value, UserRole.DOCTOR.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User role is missing or unsupported.",
            )

        patient = None
        if role_value == UserRole.PATIENT.value:
            patient = await self.patient_repository.get_patient_by_user_id(
                data_client=data_client,
                user_id=profile["id"],
            )
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Authenticated patient does not have a patient row.",
                )

        display_name = (
            profile.get("full_name")
            or (auth_user.get("user_metadata") or {}).get("name")
            or auth_user.get("email")
            or "User"
        )

        return CurrentUser(
            auth_user_id=auth_user["id"],
            profile_id=profile["id"],
            patient_id=patient.get("id") if patient else None,
            name=display_name,
            email=auth_user.get("email") or "",
            role=UserRole(role_value),
            access_token=access_token,
            raw_claims=auth_user,
        )
