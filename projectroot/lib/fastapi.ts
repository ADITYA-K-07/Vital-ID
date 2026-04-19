import type {
  Alert,
  Consultation,
  DashboardData,
  FieldPermissions,
  ForumCase,
  ForumComment,
  MedicalHistoryEntry,
  MedicalRecord,
  ProfileSummary,
  TreatmentRecord,
  ViewerContext
} from "@/types";

export interface ApiMeResponse {
  user_id: string;
  profile_id: string;
  patient_id?: string | null;
  vital_id?: string | null;
  name: string;
  email: string;
  role: "doctor" | "patient";
  license_number?: string | null;
  license_verified?: boolean;
}

export interface ApiDoctorLicenseCheckResponse {
  license_number: string;
  license_verified: boolean;
  message: string;
}

export interface ApiSessionBootstrapRequest {
  role: "doctor" | "patient";
  full_name?: string | null;
  blood_group?: string | null;
  dob?: string | null;
  emergency_contact?: string | null;
  insurance_provider?: string | null;
  allergies?: string[];
  conditions?: string[];
  vaccinations?: string[];
  license_number?: string | null;
}

export interface ApiSessionBootstrapResponse extends ApiMeResponse {}

export interface ApiDoctorDiagnosisCreateRequest {
  diagnosis: string;
}

export interface ApiDoctorTreatmentCreateRequest {
  treatment: string;
}

export interface ApiPatientTreatmentHistoryCreateRequest {
  diagnosis: string;
  specialty?: string | null;
  treatment?: string | null;
  notes?: string | null;
  follow_up_date?: string | null;
  doctor_name?: string | null;
}

export interface ApiPatientMedicalHistoryCreateRequest {
  event_type: string;
  title: string;
  description?: string | null;
  facility?: string | null;
  doctor_name?: string | null;
  event_date: string;
}

export interface ApiAlertItem {
  id: string;
  patient_id?: string | null;
  title: string;
  message: string;
  severity: string;
  status?: string | null;
  created_at?: string | null;
  is_read?: boolean | null;
}

export interface ApiFieldPermissions {
  show_allergies?: boolean;
  show_medications?: boolean;
  show_conditions?: boolean;
  show_vitals?: boolean;
  show_medical_history?: boolean;
  show_treatment_history?: boolean;
  show_psychological_info?: boolean;
  show_emergency_contact?: boolean;
  show_insurance?: boolean;
}

export interface ApiPatientProfileItem {
  id: string;
  user_id?: string | null;
  vital_id?: string | null;
  full_name: string;
  role: string;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  blood_group?: string | null;
  allergies?: string[] | string | null;
  conditions?: string[] | string | null;
  vaccinations?: string[] | string | null;
  dob?: string | null;
  emergency_contact?: string | null;
  insurance_provider?: string | null;
  created_at?: string | null;
}

export interface ApiMedicalRecordItem {
  id: string;
  patient_id?: string | null;
  doctor_id?: string | null;
  diagnosis?: string | null;
  prescription?: string | null;
  notes?: string | null;
  visit_date?: string | null;
  created_at?: string | null;
  blood_pressure?: string | null;
  heart_rate?: number | null;
  oxygen_saturation?: number | null;
  temperature?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  medications?: string[] | string | null;
}

export interface ApiConsultationItem {
  id: string;
  title: string;
  scheduled_at: string;
  mode: string;
  status: string;
  doctor_id?: string | null;
  specialist?: string | null;
}

export interface ApiTreatmentHistoryItem {
  id: string;
  doctor_id?: string | null;
  doctor_name?: string | null;
  specialty?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  notes?: string | null;
  follow_up_date?: string | null;
  added_by?: "patient" | "doctor" | null;
  created_at?: string | null;
}

export interface ApiMedicalHistoryItem {
  id: string;
  event_type: string;
  title: string;
  description?: string | null;
  facility?: string | null;
  doctor_name?: string | null;
  event_date?: string | null;
  added_by?: "patient" | "doctor" | null;
  created_at?: string | null;
}

export interface ApiPatientDashboardResponse {
  profile: ApiPatientProfileItem;
  consultations: ApiConsultationItem[];
  medical_records: ApiMedicalRecordItem[];
  treatment_history: ApiTreatmentHistoryItem[];
  medical_history: ApiMedicalHistoryItem[];
  field_permissions: ApiFieldPermissions;
  alerts: ApiAlertItem[];
  psychological_info?: string | null;
}

export interface ApiPatientIdentityResponse extends ApiPatientDashboardResponse {
  ai_insights?: unknown[];
}

export interface ApiPatientFullProfileResponse {
  patient: ApiPatientProfileItem;
  medical_records: ApiMedicalRecordItem[];
  alerts: ApiAlertItem[];
  ai_insights: unknown[];
  consultations: ApiConsultationItem[];
  treatment_history: ApiTreatmentHistoryItem[];
  medical_history: ApiMedicalHistoryItem[];
  field_permissions: ApiFieldPermissions;
}

export interface ApiForumCaseItem {
  id: string;
  doctor_id: string;
  author_name: string;
  title: string;
  symptoms?: string | null;
  description: string;
  specialty?: string | null;
  status: string;
  created_at?: string | null;
}

export interface ApiForumCasesResponse {
  cases: ApiForumCaseItem[];
}

export interface ApiForumCommentItem {
  id: string;
  case_id: string;
  doctor_id: string;
  author_name: string;
  comment: string;
  created_at?: string | null;
}

export interface ApiForumCommentsResponse {
  comments: ApiForumCommentItem[];
}

export interface ApiForumMatchedDoctor {
  name: string;
  specialty: string;
  hospital: string;
  country: string;
  reason: string;
}

export interface ApiForumSimilarCase {
  case_id: string;
  title: string;
  specialty: string;
  description: string;
  resolution: string;
}

export interface ApiForumCaseMatchResponse {
  matched_doctors: ApiForumMatchedDoctor[];
  similar_cases: ApiForumSimilarCase[];
}

export interface ApiNotesAnalyzeResponse {
  symptoms: string[];
  possible_conditions: string[];
  suggested_next_steps: string[];
  severity: "low" | "medium" | "high";
}

export interface ApiPatternDetectResponse {
  patterns: string[];
  risk_flags: Array<{ flag: string; color: "yellow" | "red" }>;
  recommendations: string[];
  summary: string;
}

export interface ApiSimilarCasesResponse {
  similar_cases: Array<{ case_id: number; description: string }>;
  common_patterns: string[];
  suggested_diagnosis: string;
  confidence: number;
  references: string[];
}

export interface PatientLookupData {
  patientId: string;
  vitalId: string | null;
  profile: ProfileSummary;
  age: number | null;
  allergies: string[];
  conditions: string[];
  vaccinations: string[];
  medicalRecords: MedicalRecord[];
  treatmentHistory: TreatmentRecord[];
  medicalHistory: MedicalHistoryEntry[];
}

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (value == null) return [];
  return [String(value)];
}

function mapProfileSummary(profile: ApiPatientProfileItem): ProfileSummary {
  return {
    id: profile.id,
    vitalId: profile.vital_id ?? null,
    fullName: profile.full_name,
    role: profile.role,
    bloodType: profile.blood_group ?? "Unknown",
    emergencyContact: profile.emergency_contact ?? "Not provided",
    insuranceProvider: profile.insurance_provider ?? "Not provided",
    dob: profile.dob ?? ""
  };
}

export function mapApiMedicalRecord(
  record: ApiMedicalRecordItem,
  profile?: ApiPatientProfileItem
): MedicalRecord {
  return {
    id: record.id,
    recordedAt: record.visit_date ?? record.created_at ?? new Date().toISOString(),
    bloodPressure: record.blood_pressure ?? "Not captured",
    heartRate: Number(record.heart_rate ?? 0),
    oxygenSaturation: Number(record.oxygen_saturation ?? 0),
    temperature: record.temperature ?? "Not captured",
    heightCm: Number(record.height_cm ?? profile?.height ?? 0),
    weightKg: Number(record.weight_kg ?? profile?.weight ?? 0),
    allergies: normalizeList(profile?.allergies),
    conditions: record.diagnosis ? [record.diagnosis] : normalizeList(profile?.conditions),
    medications: normalizeList(record.medications ?? record.prescription)
  };
}

function mapAlert(alert: ApiAlertItem): Alert {
  const severity = alert.severity.toLowerCase();
  const type: Alert["type"] =
    severity === "critical" || severity === "high"
      ? "critical"
      : severity === "medium" || severity === "warning"
        ? "warning"
        : "info";

  return {
    id: alert.id,
    type,
    message: alert.message
  };
}

function mapConsultation(consultation: ApiConsultationItem): Consultation {
  const status =
    consultation.status === "Confirmed" ||
    consultation.status === "Pending" ||
    consultation.status === "Scheduled"
      ? consultation.status
      : "Scheduled";

  const mode = consultation.mode === "In Person" ? "In Person" : "Virtual";

  return {
    id: consultation.id,
    title: consultation.title,
    specialist: consultation.specialist ?? "Care Team",
    date: consultation.scheduled_at,
    mode,
    status
  };
}

function mapTreatmentRecord(item: ApiTreatmentHistoryItem): TreatmentRecord {
  return {
    id: item.id,
    date: item.created_at ?? "",
    doctorName: item.doctor_name ?? "Care Team",
    specialty: item.specialty ?? "General Medicine",
    diagnosis: item.diagnosis ?? "Not specified",
    treatment: item.treatment ?? "Not specified",
    notes: item.notes ?? "",
    followUp: item.follow_up_date ?? undefined,
    addedBy: item.added_by ?? null
  };
}

function mapMedicalHistoryEntry(item: ApiMedicalHistoryItem): MedicalHistoryEntry {
  const allowedType = ["Surgery", "Hospitalization", "Diagnosis", "Procedure", "Vaccination"];
  const type = allowedType.includes(item.event_type) ? item.event_type as MedicalHistoryEntry["type"] : "Diagnosis";

  return {
    id: item.id,
    date: item.event_date ?? item.created_at ?? "",
    type,
    title: item.title,
    description: item.description ?? "",
    facility: item.facility ?? "Not specified",
    doctorName: item.doctor_name ?? "Care Team",
    addedBy: item.added_by ?? null
  };
}

function mapFieldPermissions(value: ApiFieldPermissions): FieldPermissions {
  return {
    showAllergies: value.show_allergies ?? true,
    showMedications: value.show_medications ?? true,
    showConditions: value.show_conditions ?? true,
    showVitals: value.show_vitals ?? true,
    showMedicalHistory: value.show_medical_history ?? true,
    showTreatmentHistory: value.show_treatment_history ?? true,
    showPsychologicalInfo: value.show_psychological_info ?? false,
    showEmergencyContact: value.show_emergency_contact ?? true,
    showInsurance: value.show_insurance ?? true
  };
}

export function mapPatientResponseToDashboardData(
  response: ApiPatientDashboardResponse | ApiPatientIdentityResponse,
  viewer: ViewerContext
): DashboardData {
  return {
    demoMode: false,
    viewer,
    profile: mapProfileSummary(response.profile),
    consultations: response.consultations.map(mapConsultation),
    credentials: [],
    diagnoses: [],
    medicalRecords: response.medical_records.map((record) =>
      mapApiMedicalRecord(record, response.profile)
    ),
    treatmentHistory: response.treatment_history.map(mapTreatmentRecord),
    medicalHistory: response.medical_history.map(mapMedicalHistoryEntry),
    fieldPermissions: mapFieldPermissions(response.field_permissions),
    alerts: response.alerts.map(mapAlert),
    psychologicalInfo: response.psychological_info ?? undefined
  };
}

export function mapApiPatientFullProfileToLookup(
  response: ApiPatientFullProfileResponse
): PatientLookupData {
  return {
    patientId: response.patient.id,
    vitalId: response.patient.vital_id ?? null,
    profile: mapProfileSummary(response.patient),
    age: response.patient.age ?? null,
    allergies: normalizeList(response.patient.allergies),
    conditions: normalizeList(response.patient.conditions),
    vaccinations: normalizeList(response.patient.vaccinations),
    medicalRecords: response.medical_records.map((record) =>
      mapApiMedicalRecord(record, response.patient)
    ),
    treatmentHistory: response.treatment_history.map(mapTreatmentRecord),
    medicalHistory: response.medical_history.map(mapMedicalHistoryEntry)
  };
}

export function mapApiForumCase(item: ApiForumCaseItem): ForumCase {
  return {
    id: item.id,
    doctorId: item.doctor_id,
    authorName: item.author_name,
    title: item.title,
    symptoms: item.symptoms ?? undefined,
    description: item.description,
    specialty: item.specialty ?? "General Medicine",
    status:
      item.status === "Needs Review" || item.status === "Resolved"
        ? item.status
        : "Shared",
    createdAt: item.created_at ?? new Date().toISOString()
  };
}

export function mapApiForumComment(item: ApiForumCommentItem): ForumComment {
  return {
    id: item.id,
    caseId: item.case_id,
    doctorId: item.doctor_id,
    authorName: item.author_name,
    comment: item.comment,
    createdAt: item.created_at ?? new Date().toISOString()
  };
}

export function buildCaseDisplayId(id: string) {
  return `CASE-${id.slice(0, 8).toUpperCase()}`;
}

function buildFastApiUrl(path: string) {
  const base =
    process.env.FASTAPI_URL ??
    process.env.NEXT_PUBLIC_FASTAPI_URL ??
    "http://localhost:8000";
  return `${base}${path}`;
}

export function getBrowserAccessToken() {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(/(?:^|; )vital-id-access-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function extractApiErrorMessage(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const detail = record.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail.trim();
  }

  if (Array.isArray(detail)) {
    const joined = detail
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          const itemRecord = item as Record<string, unknown>;
          const message = itemRecord.msg ?? itemRecord.message;
          return typeof message === "string" ? message.trim() : "";
        }
        return "";
      })
      .filter(Boolean)
      .join(", ");

    if (joined) {
      return joined;
    }
  }

  for (const key of ["message", "error_description", "error"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

async function readFastApiErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const payload = await response.json();
      const message = extractApiErrorMessage(payload);
      if (message) {
        return message;
      }
    } catch {
      // Fall through to the plain-text body when JSON parsing fails.
    }
  }

  const text = await response.text();
  return text || `FastAPI request failed with status ${response.status}`;
}

export async function fetchFastApiJson<T>(
  path: string,
  options: RequestInit & { accessToken?: string | null } = {}
): Promise<T> {
  const { accessToken, headers, ...init } = options;
  const response = await fetch(buildFastApiUrl(path), {
    ...init,
    cache: init.cache ?? "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(headers ?? {})
    }
  });

  if (!response.ok) {
    const message = await readFastApiErrorMessage(response);
    throw new Error(`FastAPI ${response.status}: ${message}`);
  }

  return response.json() as Promise<T>;
}
