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
  AlertTriangle
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
  AUTH_COOKIE_NAME,
  AUTH_LICENSE_COOKIE_NAME,
  AUTH_LICENSE_VERIFIED_COOKIE_NAME,
  AUTH_ROLE_COOKIE_NAME,
  createBrowserSupabaseClient
} from "@/lib/supabase/client";
import { mockDashboardData } from "@/lib/mock-data";
import type { DashboardData } from "@/types";

export function DoctorDashboard() {
  const router = useRouter();
  const [vitalId, setVitalId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<DashboardData | null>(null);
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

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPatientData(null);
    setLoading(true);
    try {
      // Demo: accept any input and return mock data
      await new Promise((r) => setTimeout(r, 800));
      if (!vitalId.trim() || !password.trim()) throw new Error("Please enter both Vital ID and password.");
      // In production: query Supabase with vitalId + password
      setPatientData({ ...mockDashboardData, viewer: { role: "doctor", canViewSensitive: true, licenseNumber: null, licenseVerified: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDiagnosis = async () => {
    if (!diagnosisNote.trim()) return;
    setSaveStatus("Saving...");
    await new Promise((r) => setTimeout(r, 600));
    setSaveStatus("Diagnosis added successfully.");
    setDiagnosisNote("");
    setShowAddDiagnosis(false);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleSaveTreatment = async () => {
    if (!treatmentNote.trim()) return;
    setSaveStatus("Saving...");
    await new Promise((r) => setTimeout(r, 600));
    setSaveStatus("Treatment record added successfully.");
    setTreatmentNote("");
    setShowAddTreatment(false);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const p = patientData;
  const latest = p?.medicalRecords[0];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/60 bg-white/70 p-6 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-700">Doctor Dashboard</p>
          <h1 className="mt-1 font-serif text-3xl text-slate-900 lg:text-4xl">Patient Lookup</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            Enter a patient's Vital ID and access password to view their full medical record.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="w-fit gap-2">
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>

      {/* Lookup form */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-teal-50 p-2 text-teal-700"><Search className="h-4 w-4" /></div>
            <CardTitle className="text-base">Search Patient Record</CardTitle>
          </div>
          <CardDescription>Enter the patient's Vital ID number and their access password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLookup} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="vitalid">Vital ID Number</Label>
              <Input id="vitalid" placeholder="e.g. VID-20458" value={vitalId} onChange={(e) => setVitalId(e.target.value)} required />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="patpass">Patient Password</Label>
              <Input id="patpass" type="password" placeholder="Patient access password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="shrink-0 gap-2" disabled={loading}>
              <Search className="h-4 w-4" />
              {loading ? "Searching..." : "Look up Patient"}
            </Button>
          </form>
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {saveStatus && (
            <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">{saveStatus}</div>
          )}
        </CardContent>
      </Card>

      {/* Patient info — shown after lookup */}
      {p && latest && (
        <>
          {/* Patient overview */}
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
                    { label: "Date of Birth", value: p.profile.dob },
                    { label: "Insurance", value: p.profile.insuranceProvider }
                  ].map((f) => (
                    <div key={f.label} className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">{f.label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{f.value}</p>
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
                    { label: "O₂ Saturation", value: `${latest.oxygenSaturation}%` },
                    { label: "Temperature", value: latest.temperature },
                    { label: "Height", value: `${latest.heightCm} cm` },
                    { label: "Weight", value: `${latest.weightKg} kg` }
                  ].map((v) => (
                    <div key={v.label} className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">{v.label}</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900">{v.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-amber-600 mb-2">Allergies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {latest.allergies.map((a) => <Badge key={a} variant="warning">{a}</Badge>)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Medications & Conditions */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-blue-50 p-2 text-blue-700"><Pill className="h-4 w-4" /></div>
                  <CardTitle className="text-base">Current Medications</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {latest.medications.map((m, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-border/60 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-teal-500" />
                      <p className="text-sm font-medium text-slate-900">{m}</p>
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
                {latest.conditions.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-border/60 bg-slate-50 px-4 py-3">
                    <div className="h-2 w-2 rounded-full bg-rose-400" />
                    <p className="text-sm font-medium text-slate-900">{c}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Add Diagnosis */}
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

          {/* Add Treatment */}
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