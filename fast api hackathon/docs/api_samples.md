# Sample API Responses

All protected endpoints expect:

```http
Authorization: Bearer <supabase_access_token>
```

## `GET /me`

```json
{
  "user_id": "7c927d9b-4f97-4bb7-ae34-96b65b7020b0",
  "profile_id": "f3f7d80b-7cd5-455b-aa44-ec8f746e7121",
  "name": "Dr. Aisha Khan",
  "email": "aisha.khan@careflow.demo",
  "role": "doctor"
}
```

## `GET /doctor/dashboard`

```json
{
  "doctor": {
    "id": "f3f7d80b-7cd5-455b-aa44-ec8f746e7121",
    "auth_user_id": "7c927d9b-4f97-4bb7-ae34-96b65b7020b0",
    "name": "Dr. Aisha Khan",
    "email": "aisha.khan@careflow.demo"
  },
  "assigned_patients": [
    {
      "id": "4a4eef35-8e0a-41ec-a0a3-6d2ca442f4a9",
      "name": "Rahul Mehta",
      "age": 62,
      "gender": "male"
    },
    {
      "id": "71872df7-1fc2-4d7b-aa17-41240b98ddfd",
      "name": "Sara Thomas",
      "age": 34,
      "gender": "female"
    }
  ],
  "recent_alerts": [
    {
      "id": "6d759f54-bcc5-4ed7-9c69-1f7508e1fb7d",
      "patient_id": "4a4eef35-8e0a-41ec-a0a3-6d2ca442f4a9",
      "title": "Blood pressure spike",
      "message": "Home BP upload crossed the configured threshold.",
      "severity": "high",
      "status": "open",
      "created_at": "2026-04-18T07:48:11Z",
      "assigned_doctor_id": "f3f7d80b-7cd5-455b-aa44-ec8f746e7121"
    }
  ],
  "recent_ai_insights": [
    {
      "id": "1690b01f-8ea1-4428-b0e5-2cb50e373f18",
      "patient_id": "4a4eef35-8e0a-41ec-a0a3-6d2ca442f4a9",
      "summary": "Rahul Mehta has 2 highlighted care signals. Highest urgency is high. Primary focus: Recent clinical alerts require attention.",
      "risks": [
        {
          "title": "Recent clinical alerts require attention",
          "severity": "high",
          "reason": "One or more patient alerts were recently raised in the system."
        }
      ],
      "recommendations": [
        "Review the aggregated patient history before making care decisions.",
        "Prioritize clinician review and contact the patient promptly if symptoms are active.",
        "Reconcile open alerts with the latest encounter details and vitals."
      ],
      "urgency_level": "high",
      "source": "mock-heuristic",
      "created_at": "2026-04-18T07:50:00Z"
    }
  ]
}
```

## `GET /patient/full-profile/{patient_id}`

```json
{
  "patient": {
    "id": "4a4eef35-8e0a-41ec-a0a3-6d2ca442f4a9",
    "auth_user_id": "1a8a92b9-cb39-4ea0-8b1a-96ba36e8b790",
    "name": "Rahul Mehta",
    "email": "rahul.mehta@careflow.demo",
    "phone": "+91-90000-00000",
    "age": 62,
    "gender": "male",
    "blood_group": "B+",
    "emergency_contact": "Anita Mehta",
    "doctor_private_note": "Monitor adherence and BP trend closely."
  },
  "records": [
    {
      "id": "7db61eb0-124e-4ce5-b8fb-33e1748e4c08",
      "patient_id": "4a4eef35-8e0a-41ec-a0a3-6d2ca442f4a9",
      "record_type": "visit",
      "diagnosis": "Hypertension",
      "notes": "Patient reports dizziness for two days.",
      "doctor_notes": "If symptoms persist, schedule cardiology review.",
      "visit_date": "2026-04-17",
      "created_at": "2026-04-17T12:00:00Z"
    }
  ],
  "alerts": [
    {
      "id": "6d759f54-bcc5-4ed7-9c69-1f7508e1fb7d",
      "patient_id": "4a4eef35-8e0a-41ec-a0a3-6d2ca442f4a9",
      "title": "Blood pressure spike",
      "message": "Home BP upload crossed the configured threshold.",
      "severity": "high",
      "status": "open",
      "created_at": "2026-04-18T07:48:11Z",
      "assigned_doctor_id": "f3f7d80b-7cd5-455b-aa44-ec8f746e7121"
    }
  ],
  "prescriptions": [
    {
      "id": "d3a8bf49-b9b2-401c-8130-cc9550b7d18a",
      "patient_id": "4a4eef35-8e0a-41ec-a0a3-6d2ca442f4a9",
      "medication_name": "Amlodipine",
      "dosage": "5 mg",
      "frequency": "Once daily",
      "instructions": "Take after breakfast",
      "prescribed_by": "Dr. Aisha Khan",
      "created_at": "2026-04-17T12:10:00Z"
    }
  ],
  "ai_insights": [
    {
      "id": "1690b01f-8ea1-4428-b0e5-2cb50e373f18",
      "patient_id": "4a4eef35-8e0a-41ec-a0a3-6d2ca442f4a9",
      "summary": "Rahul Mehta has 2 highlighted care signals. Highest urgency is high. Primary focus: Recent clinical alerts require attention.",
      "risks": [
        {
          "title": "Recent clinical alerts require attention",
          "severity": "high",
          "reason": "One or more patient alerts were recently raised in the system."
        }
      ],
      "recommendations": [
        "Review the aggregated patient history before making care decisions.",
        "Prioritize clinician review and contact the patient promptly if symptoms are active."
      ],
      "urgency_level": "high",
      "source": "mock-heuristic",
      "created_at": "2026-04-18T07:50:00Z"
    }
  ]
}
```

## `POST /patient/analyze/{patient_id}`

```json
{
  "patient_id": "4a4eef35-8e0a-41ec-a0a3-6d2ca442f4a9",
  "summary": "Rahul Mehta has 2 highlighted care signals. Highest urgency is high. Primary focus: Recent clinical alerts require attention.",
  "risks": [
    {
      "title": "Recent clinical alerts require attention",
      "severity": "high",
      "reason": "One or more patient alerts were recently raised in the system."
    },
    {
      "title": "Elevated monitoring risk",
      "severity": "high",
      "reason": "Historical notes suggest elevated clinical follow-up risk."
    }
  ],
  "recommendations": [
    "Review the aggregated patient history before making care decisions.",
    "Prioritize clinician review and contact the patient promptly if symptoms are active.",
    "Reconcile open alerts with the latest encounter details and vitals.",
    "Validate medication adherence and recent prescription changes with the patient."
  ],
  "urgency_level": "high",
  "timestamp": "2026-04-18T08:00:00Z",
  "source": "mock-heuristic",
  "stored_insight_id": "1690b01f-8ea1-4428-b0e5-2cb50e373f18",
  "alert_created": true
}
```

## `GET /alerts/recent`

```json
{
  "alerts": [
    {
      "id": "6d759f54-bcc5-4ed7-9c69-1f7508e1fb7d",
      "patient_id": "4a4eef35-8e0a-41ec-a0a3-6d2ca442f4a9",
      "title": "Blood pressure spike",
      "message": "Home BP upload crossed the configured threshold.",
      "severity": "high",
      "status": "open",
      "created_at": "2026-04-18T07:48:11Z",
      "assigned_doctor_id": "f3f7d80b-7cd5-455b-aa44-ec8f746e7121"
    }
  ]
}
```

# Frontend Integration Notes

## What Next.js Should Do

- Keep the Supabase auth flow in the frontend.
- Send the Supabase access token to FastAPI in the `Authorization` header.
- Treat FastAPI as the single backend entrypoint for dashboard, profile, alert, and analysis screens.

## Screen-to-Endpoint Mapping

- Logged-in session bootstrap: `GET /me`
- Doctor dashboard page: `GET /doctor/dashboard`
- Doctor QR scan or patient selection flow: `GET /patient/full-profile/{patient_id}`
- Analyze button on patient screen: `POST /patient/analyze/{patient_id}`
- Alerts widget: `GET /alerts/recent`

## Error Handling Expectations

- `401`: missing, expired, or invalid Supabase token
- `403`: authenticated but not allowed for that patient or route
- `404`: patient not found or hidden by access controls
- `502`: Supabase rejected or failed the underlying data request

## Notes For The QR Flow

- The QR payload should include the app-level `patient_id`, not just the auth user id.
- After scan, the frontend should call the full-profile endpoint directly.
- The backend will verify the doctor, validate assignment access, fetch all related data, and return one response for the patient screen.
