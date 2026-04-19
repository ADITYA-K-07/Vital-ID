import type {
  Alert,
  Consultation,
  DashboardData,
  FieldPermissions,
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
  name: string;
  email: string;
  role: "doctor" | "patient";
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

export interface ApiForumCommentItem {
  id: string;
  case_id: string;
  doctor_id: string;
  author_name: string;
  comment: string;
  created_at?: string | null;
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
  profile: ProfileSummary;
  age: number | null;
  allergies: string[];
  conditions: string[];
  vaccinations: string[];
  medicalRecords: MedicalRecord[];
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
    followUp: item.follow_up_date ?? undefined
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
    doctorName: item.doctor_name ?? "Care Team"
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
    profile: mapProfileSummary(response.patient),
    age: response.patient.age ?? null,
    allergies: normalizeList(response.patient.allergies),
    conditions: normalizeList(response.patient.conditions),
    vaccinations: normalizeList(response.patient.vaccinations),
    medicalRecords: response.medical_records.map((record) =>
      mapApiMedicalRecord(record, response.patient)
    )
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
    const text = await response.text();
    throw new Error(text || `FastAPI request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
