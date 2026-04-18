from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from utils.llm import ask_llm

router = APIRouter()

class HealthRecord(BaseModel):
    date: str
    condition: str
    notes: str

class PatternInput(BaseModel):
    records: List[HealthRecord]
    patient_name: str

@router.post("/detect")
def detect_patterns(input: PatternInput):
    records_text = "\n".join([
        f"{r.date}: {r.condition} - {r.notes}"
        for r in input.records
    ])
    
    prompt = f"""
    You are a medical AI. Analyze this patient's health history:
    
    Patient: {input.patient_name}
    Records:
    {records_text}
    
    Return a JSON with:
    - patterns: list of detected health patterns
    - risk_flags: list of concerning trends (color: yellow/red)
    - recommendations: list of suggestions
    - summary: one line health summary
    
    Return only valid JSON, no extra text.
    """
    result = ask_llm(prompt)
    return {"patterns": result}