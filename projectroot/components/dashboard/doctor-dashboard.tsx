"use client";

import {
  Search,
  LogOut,
  User,
  Pill,
  Activity,
  FileText,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  QrCode,
  KeyRound,
  ScanLine,
  Zap
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
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
//import { mockDashboardData } from "@/lib/mock-data";
import type { DashboardData } from "@/types";

type AccessMethod = "manual" | "qr";

export function DoctorDashboard() {
  const router = useRouter();
  const [accessMethod, setAccessMethod] = useState<AccessMethod>("manual");
  const [vitalId, setVitalId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<PatientLookupData | null>(null);
  const [showAddDiagnosis, setShowAddDiagnosis] = useState(false);
  const [showAddTreatment, setShowAddTreatment] = useState(false);
  const [diagnosisNote, setDiagnosisNote] = useState("");
  const [treatmentNote, setTreatmentNote] = useState("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [qrScanning, setQrScanning] = useState(false);
  const [scannedId, setScannedId] = useState("");

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

  // Manual flow — password required
  const handleManualLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPatientData(null);
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      if (!vitalId.trim() || !password.trim()) throw new Error("Please enter both Vital ID and password.");
      setPatientData({ ...mockDashboardData, viewer: { role: "doctor", canViewSensitive: true, licenseNumber: null, licenseVerified: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed.");
    } finally {
      setLoading(false);
    }
  };

  // QR flow — no password, immediate emergency access
  const handleSimulateScan = async () => {
    setQrScanning(true);
    setError(null);
    setPatientData(null);
    await new Promise((r) => setTimeout(r, 1500));
    setScannedId("VID-01DEMO");
    setQrScanning(false);
    // Immediately load patient — no password required
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setPatientData({ ...mockDashboardData, viewer: { role: "doctor", canViewSensitive: true, licenseNumber: null, licenseVerified: true } });
    setLoading(false);
  };

  const handleSaveDiagnosis = async () => {
    if (!diagnosisNote.trim()) return;
    setSaveStatus("Saving...");
    await new Promise((r) => setTimeout(r, 600));
    setSaveStatus("Diagnosis added locally. Route wiring can be layered on next.");
    setDiagnosisNote("");
    setShowAddDiagnosis(false);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleSaveTreatment = async () => {
    if (!treatmentNote.trim()) return;
    setSaveStatus("Saving...");
    await new Promise((r) => setTimeout(r, 600));
    setSaveStatus("Treatment record added locally. Route wiring can be layered on next.");
    setTreatmentNote("");
    setShowAddTreatment(false);
    setTimeout(() => setSaveStatus(null), 3000);
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
            Scan a patient's QR code or enter their VitalID number to access their medical record.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="w-fit gap-2">
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>

      {/* Access Method Toggle */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-teal-50 p-2 text-teal-700"><Search className="h-4 w-4" /></div>
            <CardTitle className="text-base">Access Patient Record</CardTitle>
          </div>
          <CardDescription>Choose how to identify the patient</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Toggle buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setAccessMethod("manual"); setScannedId(""); setPatientData(null); setError(null); }}
              className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-4 text-sm font-medium transition-all ${
                accessMethod === "manual"
                  ? "border-teal-600 bg-teal-50 text-teal-800"
                  : "border-border bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <KeyRound className="h-4 w-4" />
              Enter VitalID Manually
            </button>
            <button
              type="button"
              onClick={() => { setAccessMethod("qr"); setVitalId(""); setPassword(""); setPatientData(null); setError(null); }}
              className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-4 text-sm font-medium transition-all ${
                accessMethod === "qr"
                  ? "border-teal-600 bg-teal-50 text-teal-800"
                  : "border-border bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <QrCode className="h-4 w-4" />
              Scan QR Code
            </button>
          </div>

          {/* Manual Entry — password required */}
          {accessMethod === "manual" && (
            <form onSubmit={handleManualLookup} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="vitalid">VitalID Number</Label>
                  <Input
                    id="vitalid"
                    placeholder="e.g. VID-20458"
                    value={vitalId}
                    onChange={(e) => setVitalId(e.target.value)}
                    required
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="patpass">Patient Password</Label>
                  <Input
                    id="patpass"
                    type="password"
                    placeholder="Patient access password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="gap-2 bg-teal-700 hover:bg-teal-800" disabled={loading}>
                <Search className="h-4 w-4" />
                {loading ? "Searching..." : "Look up Patient"}
              </Button>
            </form>
          )}

          {/* QR Scan — NO password, emergency access */}
          {accessMethod === "qr" && (
            <div className="space-y-4">
              {/* Emergency notice */}
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <Zap className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Emergency Access:</strong> QR scan grants immediate access without a password. Use responsibly.
                </span>
              </div>

              {/* QR Scan area */}
              <div className="rounded-2xl border-2 border-dashed border-teal-200 bg-teal-50/50 p-6 flex flex-col items-center gap-4">
                <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
                  <ScanLine className="h-16 w-16 text-teal-300" />
                </div>
                {scannedId ? (
                  <div className="text-center space-y-1">
                    <p className="text-xs text-slate-500">QR Code Scanned Successfully ✅</p>
                    <p className="font-mono text-lg font-bold text-teal-800">{scannedId}</p>
                    {loading && <p className="text-xs text-teal-600 animate-pulse">Loading patient record...</p>}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center">
                    Point your camera at the patient's QR code
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="border-teal-200 text-teal-700 hover:bg-teal-50 gap-2"
                  onClick={handleSimulateScan}
                  disabled={qrScanning || loading}
                >
                  <QrCode className="h-4 w-4" />
                  {qrScanning ? "Scanning..." : scannedId ? "Scan Again" : "Simulate QR Scan"}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {saveStatus && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">{saveStatus}</div>
          )}
        </CardContent>
      </Card>

      {p && latest && (
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
                    { label: "Full Name", value: p.profile.fullName },
                    { label: "Blood Type", value: p.profile.bloodType },
                    { label: "Date of Birth", value: p.profile.dob || "Not provided" },
                    { label: "Insurance", value: p.profile.insuranceProvider }
                  ].map((field) => (
                    <div key={field.label} className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">{field.label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{field.value}</p>
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
                <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-amber-600 mb-2">Allergies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.allergies?.map((allergy) => <Badge key={allergy} variant="warning">{allergy}</Badge>)}
                  </div>
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
                {latest.medications.map((medication, index) => (
                  <div key={`${medication}-${index}`} className="flex items-center justify-between rounded-xl border border-border/60 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-teal-500" />
                      <p className="text-sm font-medium text-slate-900">{medication}</p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                ))}
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
                {p.conditions?.map((condition, index) => (
                  <div key={`${condition}-${index}`} className="flex items-center gap-3 rounded-xl border border-border/60 bg-slate-50 px-4 py-3">
                    <div className="h-2 w-2 rounded-full bg-rose-400" />
                    <p className="text-sm font-medium text-slate-900">{condition}</p>
                  </div>
                ))}
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
            {showAddDiagnosis && (
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Diagnosis Notes</Label>
                  <Textarea placeholder="Enter your diagnosis, observations, and recommended next steps..." rows={4} value={diagnosisNote} onChange={(e) => setDiagnosisNote(e.target.value)} />
                </div>
                <Button onClick={handleSaveDiagnosis} className="gap-2">
                  <Plus className="h-4 w-4" /> Save Diagnosis
                </Button>
              </CardContent>
            )}
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
            {showAddTreatment && (
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Treatment Details</Label>
                  <Textarea placeholder="Describe the treatment prescribed, medications, dosage, and follow-up instructions..." rows={4} value={treatmentNote} onChange={(e) => setTreatmentNote(e.target.value)} />
                </div>
                <Button onClick={handleSaveTreatment} className="gap-2">
                  <Plus className="h-4 w-4" /> Save Treatment
                </Button>
              </CardContent>
            )}
          </Card>
        </>
      )}
    </>
  );
}
