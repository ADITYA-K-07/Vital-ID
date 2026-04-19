from fastapi import Depends, HTTPException, status

from app.auth.models import CurrentUser, UserRole
from app.auth.security import get_access_token
from app.db.supabase import SupabaseDataClient, get_request_data_client
from app.services.auth_service import AuthService
from app.services.dependencies import get_auth_service


async def get_current_user(
    access_token: str = Depends(get_access_token),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    auth_service: AuthService = Depends(get_auth_service),
) -> CurrentUser:
    return await auth_service.authenticate(access_token=access_token, data_client=data_client)


def require_roles(*allowed_roles: UserRole):
    async def dependency(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in allowed_roles:
            allowed = ", ".join(role.value for role in allowed_roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied for role '{current_user.role.value}'. Allowed roles: {allowed}.",
            )
        return current_user

    return dependency
