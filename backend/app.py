from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import analyze, patterns, cases
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="VitalID AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api/analyze", tags=["Analyze"])
app.include_router(patterns.router, prefix="/api/patterns", tags=["Patterns"])
app.include_router(cases.router, prefix="/api/cases", tags=["Cases"])

@app.get("/")
def root():
    return {"status": "VitalID Backend Running 🚀"}