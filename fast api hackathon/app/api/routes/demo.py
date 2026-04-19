from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse

from app.ai.mock_provider import MockClinicalAIProvider
from app.core.config import Settings, get_settings
from app.schemas.ai import AnalyzePatientResponse
from app.schemas.demo import DemoAnalyzeRequest
from app.web.demo_page import render_demo_page

router = APIRouter(tags=["demo"])


@router.get("/", include_in_schema=False, response_class=HTMLResponse)
async def demo_page(settings: Settings = Depends(get_settings)) -> HTMLResponse:
    return HTMLResponse(render_demo_page(app_name=settings.app_name, ai_mode=settings.ai_mode))


@router.post("/demo/analyze", response_model=AnalyzePatientResponse)
async def demo_analyze(payload: DemoAnalyzeRequest) -> AnalyzePatientResponse:
    provider = MockClinicalAIProvider()
    alerts = []
    if payload.alert_message:
        alerts.append(
            {
                "title": "Demo alert",
                "message": payload.alert_message,
                "severity": payload.alert_severity.value,
            }
        )

    prescriptions = []
    if payload.has_prescriptions:
        prescriptions.append(
            {
                "medication_name": payload.medication_name,
                "dosage": "As directed",
                "frequency": "Active",
            }
        )

    patient_bundle = {
        "patient": {
            "id": "demo-patient",
            "name": payload.patient_name,
            "age": payload.age,
        },
        "records": [
            {
                "diagnosis": payload.diagnosis,
                "notes": payload.notes,
                "doctor_notes": payload.doctor_notes,
            }
        ],
        "alerts": alerts,
        "prescriptions": prescriptions,
    }
    analysis = await provider.analyze_patient(patient_bundle)
    return AnalyzePatientResponse(**analysis)
