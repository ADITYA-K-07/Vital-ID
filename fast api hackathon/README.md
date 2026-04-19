# CareFlow Backend

FastAPI acts as the intelligent middleware between the Next.js frontend and Supabase. It verifies the authenticated user, enforces role-aware access at the API layer, aggregates patient-facing data into screen-ready responses, and runs backend-only AI analysis flows.

## Quick Start

1. Create a virtual environment and install dependencies:

```bash
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and fill in your Supabase credentials.

3. Run the API:

```bash
uvicorn app.main:app --reload
```

## Key Docs

- Architecture and implementation notes: [docs/backend_architecture.md](/c:/Users/HP/Desktop/fast%20api%20hackathon/docs/backend_architecture.md)
- Sample API payloads and frontend notes: [docs/api_samples.md](/c:/Users/HP/Desktop/fast%20api%20hackathon/docs/api_samples.md)

## Main Endpoints

- `GET /me`
- `GET /doctor/dashboard`
- `GET /patient/full-profile/{patient_id}`
- `POST /patient/analyze/{patient_id}`
- `GET /alerts/recent`
