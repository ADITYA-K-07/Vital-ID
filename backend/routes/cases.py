from fastapi import APIRouter
from pydantic import BaseModel
from utils.llm import ask_llm
import json

router = APIRouter()

class CaseInput(BaseModel):
    symptoms: str
    history: str
    current_diagnosis: str

class CaseMatchInput(BaseModel):
    title: str
    specialty: str
    description: str

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

@router.post("/match")
def match_case(input: CaseMatchInput):
    prompt = f"""
You are a medical AI assistant for a collaborative diagnosis platform.

A doctor has posted this case:
Title: {input.title}
Specialty: {input.specialty}
Description: {input.description}

Your job is to return two things:

1. A list of 3 relevant doctors from around the world who would be best suited to help with this case. These should be realistic fictional doctors with name, country, specialty, hospital, and a brief reason why they are relevant.

2. A list of 3 similar past cases from medical literature or clinical records. Each case should include: a case ID, a brief title, the specialty, a description of the case, and most importantly the resolution — what was the final diagnosis and how it was treated/resolved.

Return ONLY valid JSON in this exact format, no extra text, no markdown:
{{
  "matched_doctors": [
    {{
      "name": "Dr. Full Name",
      "specialty": "Specialty",
      "hospital": "Hospital Name",
      "country": "Country",
      "reason": "Why this doctor is relevant to the case"
    }}
  ],
  "similar_cases": [
    {{
      "case_id": "CASE-XXXX",
      "title": "Case title",
      "specialty": "Specialty",
      "description": "Brief description of the case and patient presentation",
      "resolution": "Final diagnosis and how it was treated or resolved"
    }}
  ]
}}
"""
    raw = ask_llm(prompt)
    try:
        cleaned = raw.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(cleaned)
        return parsed
    except Exception:
        return {
            "matched_doctors": [],
            "similar_cases": [],
            "error": "Could not parse AI response"
        }