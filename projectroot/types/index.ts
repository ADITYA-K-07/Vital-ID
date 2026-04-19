export type SessionRole = "doctor" | "patient";

export interface Consultation {
  id: string;
  title: string;
  specialist: string;
  date: string;
  mode: "Virtual" | "In Person";
  status: "Scheduled" | "Confirmed" | "Pending";
}

export interface Credential {
  id: string;
  issuer: string;
  subject: string;
  type: string;
  status: "Verified" | "Pending Review" | "Action Needed";
  lastChecked: string;
}

export interface DiagnosisEntry {
  id: string;
  caseId: string;
  authorName: string;
  specialty: string;
  note: string;
  status: "Shared" | "Needs Review" | "Resolved";
  createdAt: string;
  confidenceScore: number;
}

export interface MedicalRecord {
  id: string;
  recordedAt: string;
  bloodPressure: string;
  heartRate: number;
  oxygenSaturation: number;
  temperature: string;
  heightCm: number;
  weightKg: number;
  allergies: string[];
  conditions: string[];
  medications: string[];
}

export interface TreatmentRecord {
  id: string;
  date: string;
  doctorName: string;
  specialty: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  followUp?: string;
  addedBy?: "patient" | "doctor" | null;
}

export interface MedicalHistoryEntry {
  id: string;
  date: string;
  type: "Surgery" | "Hospitalization" | "Diagnosis" | "Procedure" | "Vaccination";
  title: string;
  description: string;
  facility: string;
  doctorName: string;
  addedBy?: "patient" | "doctor" | null;
}

// Field-level visibility permissions set by doctor
export interface FieldPermissions {
  showAllergies: boolean;
  showMedications: boolean;
  showConditions: boolean;
  showVitals: boolean;
  showMedicalHistory: boolean;
  showTreatmentHistory: boolean;
  showPsychologicalInfo: boolean;
  showEmergencyContact: boolean;
  showInsurance: boolean;
}

export interface ProfileSummary {
  id: string;
  vitalId: string | null;
  fullName: string;
  role: string;
  bloodType: string;
  emergencyContact: string;
  insuranceProvider: string;
  dob: string;
}

export interface ForumCase {
  id: string;
  doctorId: string;
  authorName: string;
  title: string;
  symptoms?: string;
  description: string;
  specialty: string;
  status: "Shared" | "Needs Review" | "Resolved";
  createdAt: string;
}

export interface ForumComment {
  id: string;
  caseId: string;
  doctorId: string;
  authorName: string;
  comment: string;
  createdAt: string;
}

export interface ViewerContext {
  role: SessionRole;
  canViewSensitive: boolean;
  licenseNumber: string | null;
  licenseVerified: boolean;
}

export interface Alert {
  id: string;
  type: "warning" | "info" | "critical";
  message: string;
}

export interface DashboardData {
  demoMode: boolean;
  viewer: ViewerContext;
  profile: ProfileSummary;
  consultations: Consultation[];
  credentials: Credential[];
  diagnoses: DiagnosisEntry[];
  medicalRecords: MedicalRecord[];
  treatmentHistory: TreatmentRecord[];
  medicalHistory: MedicalHistoryEntry[];
  fieldPermissions: FieldPermissions;
  alerts: Alert[];
  psychologicalInfo?: string;
}
