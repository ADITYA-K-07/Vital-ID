from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.auth.models import CurrentUser
from app.db.supabase import SupabaseDataClient, get_request_data_client
from app.schemas.alerts import RecentAlertsResponse
from app.services.alert_service import AlertService
from app.services.dependencies import get_alert_service

router = APIRouter(tags=["alerts"])


@router.get("/alerts/recent", response_model=RecentAlertsResponse)
async def get_recent_alerts(
    current_user: CurrentUser = Depends(get_current_user),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    alert_service: AlertService = Depends(get_alert_service),
) -> RecentAlertsResponse:
    return await alert_service.get_recent_alerts(current_user=current_user, data_client=data_client)
