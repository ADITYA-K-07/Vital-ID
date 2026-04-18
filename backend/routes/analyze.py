from fastapi import APIRouter
from pydantic import BaseModel
from utils.llm import ask_llm

router = APIRouter()

class NotesInput(BaseModel):
    notes: str

@router.post("/notes")
def analyze_notes(input: NotesInput):
    prompt = f"""
    You are a medical AI assistant. Analyze these doctor notes:
    
    "{input.notes}"
    
    Return a JSON with:
    - symptoms: list of symptoms found
    - possible_conditions: list of possible conditions
    - suggested_next_steps: list of recommended actions
    - severity: low/medium/high
    
    Return only valid JSON, no extra text.
    """
    result = ask_llm(prompt)
    return {"analysis": result}