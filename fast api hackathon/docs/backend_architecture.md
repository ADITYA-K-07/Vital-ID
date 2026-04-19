# Architecture Summary

This backend follows a strict 3-layer flow:

1. Next.js handles presentation only.
2. FastAPI handles identity, role checks, aggregation, and AI orchestration.
3. Supabase remains the data and security source of truth through Auth and RLS.

The backend is intentionally action-based instead of table-based. Each route matches a user workflow or screen, so the frontend asks for outcomes like "doctor dashboard" or "full patient profile" rather than raw table reads.

## Folder Structure

```text
app/
  main.py
  api/
    router.py
    routes/
      me.py
      doctor.py
      patient.py
      alerts.py
  core/
    config.py
  auth/
    models.py
    security.py
    dependencies.py
  db/
    supabase.py
    user_repository.py
    doctor_repository.py
    patient_repository.py
    alert_repository.py
    insight_repository.py
  services/
    auth_service.py
    patient_service.py
    dashboard_service.py
    alert_service.py
    ai_service.py
    dependencies.py
  schemas/
    me.py
    dashboard.py
    patient.py
    alerts.py
    ai.py
  ai/
    provider.py
  utils/
    datetime.py
```

## Implementation Plan

1. Create a FastAPI project skeleton with clean separation between routes, services, repositories, auth, and schemas.
2. Implement Supabase-backed JWT verification and current-user resolution.
3. Add request-scoped Supabase data access so every data query runs with the caller's JWT and keeps RLS active.
4. Build role-aware services for doctor dashboard, patient profile aggregation, alerts, and AI analysis.
5. Add mock AI logic that is demo-friendly even without an external model key.
6. Document payloads, assumptions, and frontend integration expectations.

## Dependency List

```text
fastapi
uvicorn[standard]
httpx
pydantic-settings
email-validator
```

## Environment Variables

```text
APP_NAME
ENVIRONMENT
DEBUG
CORS_ORIGINS
REQUEST_TIMEOUT_SECONDS

SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_SCHEMA

AI_MODE
AI_INSIGHT_STORE_ENABLED
AI_CREATE_ALERTS_ENABLED
```

## Auth Flow Design

### Request Flow

1. Next.js sends the Supabase access token in the `Authorization: Bearer <token>` header.
2. FastAPI extracts the bearer token in `app/auth/security.py`.
3. `AuthService` validates the token against Supabase Auth using `GET /auth/v1/user`.
4. FastAPI resolves the application profile from the `profiles` table using the same user token.
5. The role is resolved from `profiles.role`, with `app_metadata.role` as a secondary fallback.
6. The `CurrentUser` object becomes available to all protected endpoints through dependency injection.

### Why This Is Safe

- FastAPI enforces route-level access early.
- Supabase still enforces row-level security when the backend queries data because the backend forwards the caller's JWT to Supabase.
- The backend shapes responses so patients do not receive doctor-only fields.

## JWT Verification Approach

This implementation validates the frontend token by calling Supabase Auth's user endpoint from the backend. That gives us two useful guarantees:

- the token is verified by Supabase before request processing continues
- we receive the authoritative authenticated user payload for the current request

For hackathon speed, this is simpler than implementing a local JWKS cache. If you later want lower auth latency, you can swap the auth verification inside `AuthService` without changing route or service contracts.

## Supabase Integration Layer

### Table Access Strategy

The backend uses a request-scoped Supabase data client:

- `apikey` uses the Supabase anon key
- `Authorization` uses the logged-in user's bearer token

That means all reads and writes for the required endpoints continue to pass through Supabase RLS instead of bypassing it. The service role key is kept only as an optional future capability for trusted internal jobs, but it is not required by the current endpoints.

### Repository Design

- `UserRepository`: profile lookup and identity metadata
- `DoctorRepository`: doctor-to-patient assignment checks
- `PatientRepository`: records and prescriptions
- `AlertRepository`: recent alerts and AI-created alerts
- `InsightRepository`: recent insights and persisted analysis

### Service Design

- `AuthService`: token verification and current-user resolution
- `DashboardService`: doctor dashboard aggregation
- `PatientService`: QR flow and full-profile aggregation
- `AlertService`: recent relevant alerts
- `AIService`: patient data preparation, AI execution, insight persistence, optional alert creation

## Assumed Supabase Tables

Because the schema was not provided, the backend assumes these tables exist:

### `profiles`

```text
id
auth_user_id
name
email
role
phone
age
gender
blood_group
emergency_contact
doctor_private_note
```

### `doctor_patient_assignments`

```text
doctor_id
patient_id
```

### `medical_records`

```text
id
patient_id
record_type
diagnosis
notes
doctor_notes
visit_date
created_at
```

### `alerts`

```text
id
patient_id
title
message
severity
status
assigned_doctor_id
created_at
created_by
```

### `prescriptions`

```text
id
patient_id
medication_name
dosage
frequency
instructions
prescribed_by
created_at
```

### `ai_insights`

```text
id
patient_id
summary
risks
recommendations
urgency_level
source
created_at
created_by
```

## Recommended RLS Direction

- Patients can `select` their own `profiles`, `medical_records`, `alerts`, `prescriptions`, and `ai_insights`.
- Doctors can `select` patient rows only when a matching record exists in `doctor_patient_assignments`.
- Patients should not receive doctor-only fields through API response shaping.
- Sensitive authorization facts should live in trusted tables or `app_metadata`, not `user_metadata`.

## Demo Explanation Script

Short version:

> We use FastAPI as a middleware layer to handle authentication, data aggregation, role-based access, and AI processing, while Supabase enforces secure and role-based data access.

Slightly longer version:

> Our frontend stays lightweight and only calls action-based FastAPI endpoints. FastAPI verifies the Supabase JWT, resolves the current user and role, aggregates patient data into a screen-ready response, and runs AI analysis on the backend only. Supabase remains the final security boundary with row-level security, so even if an API rule is misconfigured, database policies still protect patient data.
