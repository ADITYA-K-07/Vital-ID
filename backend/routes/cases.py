from fastapi import APIRouter
from pydantic import BaseModel
from utils.llm import ask_llm

router = APIRouter()

class CaseInput(BaseModel):
    symptoms: str
    history: str
    current_diagnosis: str

@router.post("/similar")
def find_similar_cases(input: CaseInput):
    prompt = f"""
    You are a medical AI trained on rare disease patterns.
    
    A doctor has submitted this case:
    Symptoms: {input.symptoms}
    Patient History: {input.history}
    Current Diagnosis: {input.current_diagnosis}
    
    Return a JSON with:
    - similar_cases: list of 3 similar known medical cases with description
    - common_patterns: what these cases share
    - suggested_diagnosis: most likely diagnosis
    - confidence: percentage confidence
    - references: list of medical conditions to investigate
    
    Return only valid JSON, no extra text.
    """
    result = ask_llm(prompt)
    return {"similar_cases": result}