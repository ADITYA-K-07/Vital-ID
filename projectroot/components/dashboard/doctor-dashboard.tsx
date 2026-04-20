"use client";

import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  KeyRound,
  LogOut,
  Pill,
  Plus,
  QrCode,
  ScanLine,
  Search,
  User,
  Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type ApiDoctorDiagnosisCreateRequest,
  type ApiDoctorTreatmentCreateRequest,
  type ApiPatientFullProfileResponse,
  type PatientLookupData,
  fetchFastApiJson,
  getBrowserAccessToken,
  mapApiPatientFullProfileToLookup
} from "@/lib/fastapi";
import { mockDashboardData } from "@/lib/mock-data";
import {
  AUTH_COOKIE_NAME,
  AUTH_LICENSE_COOKIE_NAME,
  AUTH_LICENSE_VERIFIED_COOKIE_NAME,
  AUTH_ROLE_COOKIE_NAME,
  DEMO_SESSION_TOKEN,
  createBrowserSupabaseClient
} from "@/lib/supabase/client";

type AccessMethod = "manual" | "qr";

function createDemoPatientLookup(): PatientLookupData {
  return {
    patientId: mockDashboardData.profile.id,
    vitalId: mockDashboardData.profile.vitalId,
    profile: mockDashboardData.profile,
    age: null,
    allergies: mockDashboardData.medicalRecords[0]?.allergies ?? [],
    conditions: mockDashboardData.medicalRecords[0]?.conditions ?? [],
    vaccinations: [],
    medicalRecords: mockDashboardData.medicalRecords,
    treatmentHistory: mockDashboardData.treatmentHistory,
    medicalHistory: mockDashboardData.medicalHistory
  };
}

function parseLookupIdentifier(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as { vitalId?: string; vital_id?: string; patientId?: string };
      return parsed.vitalId ?? parsed.vital_id ?? parsed.patientId ?? trimmed;
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

export function DoctorDashboard() {
  const router = useRouter();
  const [accessMethod, setAccessMethod] = useState<AccessMethod>("manual");
  const [manualIdentifier, setManualIdentifier] = useState("");
  const [qrIdentifier, setQrIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<PatientLookupData | null>(null);
  const [showAddDiagnosis, setShowAddDiagnosis] = useState(false);
  const [showAddTreatment, setShowAddTreatment] = useState(false);
  const [diagnosisNote, setDiagnosisNote] = useState("");
  const [treatmentNote, setTreatmentNote] = useState("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
    document.cookie = `${AUTH_ROLE_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
    document.cookie = `${AUTH_LICENSE_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
    document.cookie = `${AUTH_LICENSE_VERIFIED_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
    router.push("/login");
    router.refresh();
  };

  const lookupPatient = async (rawIdentifier: string) => {
    const identifier = parseLookupIdentifier(rawIdentifier);
    if (!identifier) {
      throw new Error("Enter or paste a VitalID, patient UUID, or QR payload first.");
    }

    const accessToken = getBrowserAccessToken();
    if (!accessToken || accessToken === DEMO_SESSION_TOKEN) {
      setPatientData(createDemoPatientLookup());
      return;
    }

    const data = await fetchFastApiJson<ApiPatientFullProfileResponse>(
      `/api/patients/lookup/${encodeURIComponent(identifier)}`,
      { accessToken }
    );
    setPatientData(mapApiPatientFullProfileToLookup(data));
  };

  const handleManualLookup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await lookupPatient(manualIdentifier);
    } catch (caughtError) {
      setPatientData(null);
      setError(caughtError instanceof Error ? caughtError.message : "Lookup failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleQrLookup = async () => {
    setError(null);
    setLoading(true);

    try {
      await lookupPatient(qrIdentifier);
    } catch (caughtError) {
      setPatientData(null);
      setError(caughtError instanceof Error ? caughtError.message : "Lookup failed.");
    } finally {
      setLoading(false);
    }
  };

  const refreshFromProfile = (response: ApiPatientFullProfileResponse) => {
    setPatientData(mapApiPatientFullProfileToLookup(response));
  };

  const handleSaveDiagnosis = async () => {
    if (!patientData || !diagnosisNote.trim()) return;

    try {
      setSaveStatus("Saving diagnosis...");
      const accessToken = getBrowserAccessToken();

      if (!accessToken || accessToken === DEMO_SESSION_TOKEN) {
        setSaveStatus("Diagnosis saved in demo mode.");
      } else {
        const payload: ApiDoctorDiagnosisCreateRequest = { diagnosis: diagnosisNote.trim() };
        const data = await fetchFastApiJson<ApiPatientFullProfileResponse>(
          `/api/patients/${encodeURIComponent(patientData.patientId)}/diagnoses`,
          {
            method: "POST",
            accessToken,
            body: JSON.stringify(payload)
          }
        );
        refreshFromProfile(data);
        setSaveStatus("Diagnosis added and patient data refreshed.");
      }

      setDiagnosisNote("");
      setShowAddDiagnosis(false);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (caughtError) {
      setSaveStatus(caughtError instanceof Error ? caughtError.message : "Unable to save diagnosis.");
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const handleSaveTreatment = async () => {
    if (!patientData || !treatmentNote.trim()) return;

    try {
      setSaveStatus("Saving treatment...");
      const accessToken = getBrowserAccessToken();

      if (!accessToken || accessToken === DEMO_SESSION_TOKEN) {
        setSaveStatus("Treatment saved in demo mode.");
      } else {
        const payload: ApiDoctorTreatmentCreateRequest = { treatment: treatmentNote.trim() };
        const data = await fetchFastApiJson<ApiPatientFullProfileResponse>(
          `/api/patients/${encodeURIComponent(patientData.patientId)}/treatments`,
          {
            method: "POST",
            accessToken,
            body: JSON.stringify(payload)
          }
        );
        refreshFromProfile(data);
        setSaveStatus("Treatment added and patient data refreshed.");
      }

      setTreatmentNote("");
      setShowAddTreatment(false);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (caughtError) {
      setSaveStatus(caughtError instanceof Error ? caughtError.message : "Unable to save treatment.");
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const p = patientData;
  const latest = p?.medicalRecords[0];

  return (
    <>
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/60 bg-white/70 p-6 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-700">Doctor Dashboard</p>
          <h1 className="mt-1 font-serif text-3xl text-slate-900 lg:text-4xl">Patient Lookup</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            Search by VitalID, paste a QR payload, or use the patient UUID when you need a direct record lookup.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="w-fit gap-2">
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-teal-50 p-2 text-teal-700"><Search className="h-4 w-4" /></div>
            <CardTitle className="text-base">Access Patient Record</CardTitle>
          </div>
          <CardDescription>Choose how to identify the patient</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setAccessMethod("manual"); setError(null); }}
              className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-4 text-sm font-medium transition-all ${
                accessMethod === "manual"
                  ? "border-teal-600 bg-teal-50 text-teal-800"
                  : "border-border bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <KeyRound className="h-4 w-4" />
              Enter Identifier
            </button>
            <button
              type="button"
              onClick={() => { setAccessMethod("qr"); setError(null); }}
              className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-4 text-sm font-medium transition-all ${
                accessMethod === "qr"
                  ? "border-teal-600 bg-teal-50 text-teal-800"
                  : "border-border bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <QrCode className="h-4 w-4" />
              Paste QR Payload
            </button>
          </div>

          {accessMethod === "manual" ? (
            <form onSubmit={handleManualLookup} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="patient-identifier">VitalID or patient UUID</Label>
                <Input
                  id="patient-identifier"
                  placeholder="e.g. VID-20458 or patient UUID"
                  value={manualIdentifier}
                  onChange={(e) => setManualIdentifier(e.target.value)}
                  required
                  className="font-mono"
                />
              </div>
              <Button type="submit" className="gap-2 bg-teal-700 hover:bg-teal-800" disabled={loading}>
                <Search className="h-4 w-4" />
                {loading ? "Searching..." : "Look up Patient"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <Zap className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Paste the QR payload JSON or a plain identifier. If the QR contains a `vitalId`, we’ll resolve that automatically.
                </span>
              </div>

              <div className="rounded-2xl border-2 border-dashed border-teal-200 bg-teal-50/50 p-6 space-y-4">
                <div className="flex items-center gap-3 text-slate-500">
                  <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
                    <ScanLine className="h-10 w-10 text-teal-300" />
                  </div>
                  <p className="text-sm">Paste the scanned QR payload below to resolve the patient's record.</p>
                </div>
                <Textarea
                  placeholder='{"vitalId":"VID-01DEMO","name":"Anika Sharma"}'
                  rows={4}
                  value={qrIdentifier}
                  onChange={(e) => setQrIdentifier(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-teal-200 text-teal-700 hover:bg-teal-50 gap-2"
                  onClick={handleQrLookup}
                  disabled={loading}
                >
                  <QrCode className="h-4 w-4" />
                  {loading ? "Loading..." : "Resolve from QR"}
                </Button>
              </div>
            </div>
          )}

          {error ? (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </div>
          ) : null}
          {p ? (
            <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
              Loaded <span className="font-semibold">{p.profile.fullName}</span>
              {p.vitalId ? ` (${p.vitalId})` : ""} with{" "}
              <span className="font-semibold">{p.medicalRecords.length}</span> medical record
              {p.medicalRecords.length === 1 ? "" : "s"}.
            </div>
          ) : null}
          {saveStatus ? (
            <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">{saveStatus}</div>
          ) : null}
        </CardContent>
      </Card>

      {p ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-teal-50 p-2 text-teal-700"><User className="h-4 w-4" /></div>
                  <CardTitle className="text-base">Patient Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "VitalID", value: p.vitalId ?? "Not available" },
                    { label: "Full Name", value: p.profile.fullName },
                    { label: "Blood Type", value: p.profile.bloodType },
                    { label: "Date of Birth", value: p.profile.dob || "Not provided" },
                    { label: "Insurance", value: p.profile.insuranceProvider },
                    { label: "Record ID", value: p.patientId }
                  ].map((field) => (
                    <div key={field.label} className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">{field.label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 break-all">{field.value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-rose-500">Emergency Contact</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{p.profile.emergencyContact}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-violet-50 p-2 text-violet-700"><Activity className="h-4 w-4" /></div>
                  <CardTitle className="text-base">Latest Vitals</CardTitle>
                </div>
                <CardDescription>Most recent recorded measurements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {latest ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Blood Pressure", value: latest.bloodPressure },
                      { label: "Heart Rate", value: `${latest.heartRate} bpm` },
                      { label: "O2 Saturation", value: `${latest.oxygenSaturation}%` },
                      { label: "Temperature", value: latest.temperature },
                      { label: "Height", value: `${latest.heightCm} cm` },
                      { label: "Weight", value: `${latest.weightKg} kg` }
                    ].map((vital) => (
                      <div key={vital.label} className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">{vital.label}</p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">{vital.value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    No vitals recorded yet for this patient.
                  </div>
                )}
                <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-amber-600 mb-2">Allergies</p>
                  {p.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {p.allergies.map((allergy) => <Badge key={allergy} variant="warning">{allergy}</Badge>)}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-700">No allergies recorded yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-blue-50 p-2 text-blue-700"><Pill className="h-4 w-4" /></div>
                  <CardTitle className="text-base">Current Medications</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {latest?.medications.length ? (
                  latest.medications.map((medication, index) => (
                    <div key={`${medication}-${index}`} className="flex items-center justify-between rounded-xl border border-border/60 bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-teal-500" />
                        <p className="text-sm font-medium text-slate-900">{medication}</p>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    No medications recorded yet.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-rose-50 p-2 text-rose-700"><FileText className="h-4 w-4" /></div>
                  <CardTitle className="text-base">Conditions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {p.conditions.length > 0 ? (
                  p.conditions.map((condition, index) => (
                    <div key={`${condition}-${index}`} className="flex items-center gap-3 rounded-xl border border-border/60 bg-slate-50 px-4 py-3">
                      <div className="h-2 w-2 rounded-full bg-rose-400" />
                      <p className="text-sm font-medium text-slate-900">{condition}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    No conditions recorded yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-teal-50 p-2 text-teal-700"><Plus className="h-4 w-4" /></div>
                  <CardTitle className="text-base">Add New Diagnosis</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowAddDiagnosis(!showAddDiagnosis)}>
                  {showAddDiagnosis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {showAddDiagnosis ? (
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Diagnosis Notes</Label>
                  <Textarea placeholder="Enter your diagnosis, observations, and recommended next steps..." rows={4} value={diagnosisNote} onChange={(e) => setDiagnosisNote(e.target.value)} />
                </div>
                <Button onClick={handleSaveDiagnosis} className="gap-2">
                  <Plus className="h-4 w-4" /> Save Diagnosis
                </Button>
              </CardContent>
            ) : null}
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-violet-50 p-2 text-violet-700"><Plus className="h-4 w-4" /></div>
                  <CardTitle className="text-base">Add New Treatment</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowAddTreatment(!showAddTreatment)}>
                  {showAddTreatment ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {showAddTreatment ? (
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Treatment Details</Label>
                  <Textarea placeholder="Describe the treatment prescribed, medications, dosage, and follow-up instructions..." rows={4} value={treatmentNote} onChange={(e) => setTreatmentNote(e.target.value)} />
                </div>
                <Button onClick={handleSaveTreatment} className="gap-2">
                  <Plus className="h-4 w-4" /> Save Treatment
                </Button>
              </CardContent>
            ) : null}
          </Card>
        </>
      ) : null}
    </>
  );
}
