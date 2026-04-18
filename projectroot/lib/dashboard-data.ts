import { cookies } from "next/headers";

import { mockDashboardData } from "@/lib/mock-data";
import {
  AUTH_COOKIE_NAME,
  AUTH_LICENSE_COOKIE_NAME,
  AUTH_LICENSE_VERIFIED_COOKIE_NAME,
  AUTH_ROLE_COOKIE_NAME,
  DEMO_SESSION_TOKEN,
  createServerSupabaseClient,
  hasSupabaseEnv,
  isSessionRole
} from "@/lib/supabase/client";
import type { DashboardData, DiagnosisEntry, MedicalRecord, ProfileSummary } from "@/types";

function mapProfile(raw: Record<string, unknown>): ProfileSummary {
  return {
    id: String(raw.id ?? mockDashboardData.profile.id),
    fullName: String(raw.full_name ?? mockDashboardData.profile.fullName),
    role: String(raw.role ?? mockDashboardData.profile.role),
    bloodType: String(raw.blood_type ?? mockDashboardData.profile.bloodType),
    emergencyContact: String(raw.emergency_contact ?? mockDashboardData.profile.emergencyContact),
    insuranceProvider: String(raw.insurance_provider ?? mockDashboardData.profile.insuranceProvider),
    dob: String(raw.dob ?? mockDashboardData.profile.dob)
  };
}

function mapMedicalRecord(raw: Record<string, unknown>): MedicalRecord {
  return {
    id: String(raw.id),
    recordedAt: String(raw.recorded_at),
    bloodPressure: String(raw.blood_pressure ?? "Not captured"),
    heartRate: Number(raw.heart_rate ?? 0),
    oxygenSaturation: Number(raw.oxygen_saturation ?? 0),
    temperature: String(raw.temperature ?? "Not captured"),
    heightCm: Number(raw.height_cm ?? 0),
    weightKg: Number(raw.weight_kg ?? 0),
    allergies: Array.isArray(raw.allergies) ? raw.allergies.map(String) : [],
    conditions: Array.isArray(raw.conditions) ? raw.conditions.map(String) : [],
    medications: Array.isArray(raw.medications) ? raw.medications.map(String) : []
  };
}

function mapDiagnosis(raw: Record<string, unknown>): DiagnosisEntry {
  return {
    id: String(raw.id),
    caseId: String(raw.case_id ?? "CASE-UNKNOWN"),
    authorName: String(raw.author_name ?? "Care Team"),
    specialty: String(raw.specialty ?? "General"),
    note: String(raw.note ?? ""),
    status: raw.status === "Resolved" || raw.status === "Needs Review" ? raw.status : "Shared",
    createdAt: String(raw.created_at),
    confidenceScore: Number(raw.confidence_score ?? 0.5)
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const roleValue = cookieStore.get(AUTH_ROLE_COOKIE_NAME)?.value;
  const viewerRole = isSessionRole(roleValue) ? roleValue : "patient";
  const viewer = {
    role: viewerRole,
    canViewSensitive: viewerRole === "doctor",
    licenseNumber: cookieStore.get(AUTH_LICENSE_COOKIE_NAME)?.value ?? null,
    licenseVerified: cookieStore.get(AUTH_LICENSE_VERIFIED_COOKIE_NAME)?.value === "true"
  };

  if (!hasSupabaseEnv() || !accessToken || accessToken === DEMO_SESSION_TOKEN) {
    return { ...mockDashboardData, viewer };
  }

  const supabase = createServerSupabaseClient(accessToken);
  if (!supabase) return { ...mockDashboardData, viewer };

  try {
    const [profileResult, recordsResult, diagnosesResult] = await Promise.all([
      supabase.from("profiles").select("*").limit(1).maybeSingle(),
      supabase.from("medical_records").select("*").order("recorded_at", { ascending: false }).limit(6),
      supabase.from("diagnoses").select("*").order("created_at", { ascending: false }).limit(8)
    ]);

    return {
      ...mockDashboardData,
      demoMode: false,
      viewer,
      profile: profileResult.data && !profileResult.error
        ? mapProfile(profileResult.data as Record<string, unknown>)
        : mockDashboardData.profile,
      medicalRecords: recordsResult.data && !recordsResult.error && recordsResult.data.length > 0
        ? recordsResult.data.map((r) => mapMedicalRecord(r as Record<string, unknown>))
        : mockDashboardData.medicalRecords,
      diagnoses: diagnosesResult.data && !diagnosesResult.error && diagnosesResult.data.length > 0
        ? diagnosesResult.data.map((e) => mapDiagnosis(e as Record<string, unknown>))
        : mockDashboardData.diagnoses
    };
  } catch {
    return { ...mockDashboardData, viewer };
  }
}