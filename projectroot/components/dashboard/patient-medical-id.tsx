"use client";

import {
  Activity,
  Building2,
  Calendar,
  Check,
  Download,
  FileText,
  Pencil,
  Pill,
  Plus,
  QrCode,
  Stethoscope,
  Trash2,
  User,
  X
} from "lucide-react";
import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  type ApiPatientIdentityResponse,
  type ApiPatientMedicalHistoryCreateRequest,
  type ApiPatientTreatmentHistoryCreateRequest,
  fetchFastApiJson,
  getBrowserAccessToken,
  mapPatientResponseToDashboardData
} from "@/lib/fastapi";
import { DEMO_SESSION_TOKEN } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { DashboardData } from "@/types";

const historyTypeColor: Record<string, string> = {
  Surgery: "bg-rose-100 text-rose-700 border-rose-200",
  Hospitalization: "bg-amber-100 text-amber-700 border-amber-200",
  Diagnosis: "bg-blue-100 text-blue-700 border-blue-200",
  Procedure: "bg-violet-100 text-violet-700 border-violet-200",
  Vaccination: "bg-teal-100 text-teal-700 border-teal-200"
};

const HISTORY_TYPES = ["Diagnosis", "Surgery", "Hospitalization", "Procedure", "Vaccination"];

export function PatientMedicalID({ data }: { data: DashboardData }) {
  const [localData, setLocalData] = useState<DashboardData>(data);
  const { profile, medicalRecords, treatmentHistory, medicalHistory, fieldPermissions } = localData;
  const latest = medicalRecords[0];
  const qrRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showAddMedicalHistory, setShowAddMedicalHistory] = useState(false);
  const [showAddDiagnosis, setShowAddDiagnosis] = useState(false);

  const [editData, setEditData] = useState({
    fullName: profile.fullName,
    bloodType: profile.bloodType,
    dob: profile.dob,
    emergencyContact: profile.emergencyContact,
    insuranceProvider: profile.insuranceProvider,
    allergies: latest?.allergies.join(", ") ?? "",
    medications: latest?.medications.join(", ") ?? "",
    conditions: latest?.conditions.join(", ") ?? ""
  });

  const [newMedicalHistory, setNewMedicalHistory] = useState<ApiPatientMedicalHistoryCreateRequest>({
    event_type: "Diagnosis",
    title: "",
    description: "",
    facility: "",
    doctor_name: "",
    event_date: ""
  });

  const [newDiagnosis, setNewDiagnosis] = useState<ApiPatientTreatmentHistoryCreateRequest>({
    diagnosis: "",
    specialty: "",
    treatment: "",
    notes: "",
    doctor_name: "",
    follow_up_date: ""
  });

  const vitalId = profile.vitalId ?? profile.id;
  const qrData = JSON.stringify({
    name: editData.fullName,
    bloodType: editData.bloodType,
    dob: editData.dob,
    emergencyContact: editData.emergencyContact,
    allergies: editData.allergies,
    medications: editData.medications,
    conditions: editData.conditions,
    vitalId,
    generatedAt: new Date().toISOString()
  });

  const applyResponse = (response: ApiPatientIdentityResponse, message: string) => {
    setLocalData(mapPatientResponseToDashboardData(response, localData.viewer));
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VitalID-${editData.fullName.replace(" ", "-")}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const accessToken = getBrowserAccessToken();
      const payload = {
        full_name: editData.fullName,
        blood_group: editData.bloodType,
        dob: editData.dob,
        emergency_contact: editData.emergencyContact,
        insurance_provider: editData.insuranceProvider,
        allergies: editData.allergies.split(",").map((item) => item.trim()).filter(Boolean),
        medications: editData.medications.split(",").map((item) => item.trim()).filter(Boolean),
        conditions: editData.conditions.split(",").map((item) => item.trim()).filter(Boolean)
      };

      if (!accessToken || accessToken === DEMO_SESSION_TOKEN) {
        setLocalData((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            fullName: editData.fullName,
            bloodType: editData.bloodType,
            dob: editData.dob,
            emergencyContact: editData.emergencyContact,
            insuranceProvider: editData.insuranceProvider
          },
          medicalRecords: prev.medicalRecords.map((record, index) =>
            index === 0
              ? {
                  ...record,
                  allergies: payload.allergies,
                  medications: payload.medications,
                  conditions: payload.conditions
                }
              : record
          )
        }));
        setStatusMessage("Updated in demo mode.");
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        const response = await fetchFastApiJson<ApiPatientIdentityResponse>("/api/patients/me/identity", {
          method: "PATCH",
          accessToken,
          body: JSON.stringify(payload)
        });
        applyResponse(response, "Profile updated.");
      }

      setIsEditing(false);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to save changes.");
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      fullName: localData.profile.fullName,
      bloodType: localData.profile.bloodType,
      dob: localData.profile.dob,
      emergencyContact: localData.profile.emergencyContact,
      insuranceProvider: localData.profile.insuranceProvider,
      allergies: localData.medicalRecords[0]?.allergies.join(", ") ?? "",
      medications: localData.medicalRecords[0]?.medications.join(", ") ?? "",
      conditions: localData.medicalRecords[0]?.conditions.join(", ") ?? ""
    });
    setIsEditing(false);
  };

  const handleAddMedicalHistory = async () => {
    if (!newMedicalHistory.title || !newMedicalHistory.event_date) return;

    try {
      const accessToken = getBrowserAccessToken();
      if (!accessToken || accessToken === DEMO_SESSION_TOKEN) {
        setLocalData((prev) => ({
          ...prev,
          medicalHistory: [
            {
              id: `demo-history-${Date.now()}`,
              date: newMedicalHistory.event_date,
              type: newMedicalHistory.event_type as "Diagnosis" | "Surgery" | "Hospitalization" | "Procedure" | "Vaccination",
              title: newMedicalHistory.title,
              description: newMedicalHistory.description ?? "",
              facility: newMedicalHistory.facility ?? "Not specified",
              doctorName: newMedicalHistory.doctor_name ?? "Care Team",
              addedBy: "patient"
            },
            ...prev.medicalHistory
          ]
        }));
        setStatusMessage("Medical history saved in demo mode.");
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        const response = await fetchFastApiJson<ApiPatientIdentityResponse>("/api/patients/me/medical-history", {
          method: "POST",
          accessToken,
          body: JSON.stringify(newMedicalHistory)
        });
        applyResponse(response, "Medical history entry added.");
      }
      setNewMedicalHistory({
        event_type: "Diagnosis",
        title: "",
        description: "",
        facility: "",
        doctor_name: "",
        event_date: ""
      });
      setShowAddMedicalHistory(false);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to add medical history.");
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleDeleteMedicalHistory = async (id: string) => {
    try {
      const accessToken = getBrowserAccessToken();
      if (!accessToken || accessToken === DEMO_SESSION_TOKEN) {
        setLocalData((prev) => ({
          ...prev,
          medicalHistory: prev.medicalHistory.filter((entry) => entry.id !== id)
        }));
      } else {
        const response = await fetchFastApiJson<ApiPatientIdentityResponse>(
          `/api/patients/me/medical-history/${encodeURIComponent(id)}`,
          { method: "DELETE", accessToken }
        );
        applyResponse(response, "Medical history entry deleted.");
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to delete medical history.");
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleAddDiagnosis = async () => {
    if (!newDiagnosis.diagnosis) return;

    try {
      const accessToken = getBrowserAccessToken();
      if (!accessToken || accessToken === DEMO_SESSION_TOKEN) {
        setLocalData((prev) => ({
          ...prev,
          treatmentHistory: [
            {
              id: `demo-treatment-${Date.now()}`,
              date: new Date().toISOString().slice(0, 10),
              doctorName: newDiagnosis.doctor_name || "Care Team",
              specialty: newDiagnosis.specialty || "General Medicine",
              diagnosis: newDiagnosis.diagnosis,
              treatment: newDiagnosis.treatment || "Not specified",
              notes: newDiagnosis.notes || "",
              followUp: newDiagnosis.follow_up_date || undefined,
              addedBy: "patient"
            },
            ...prev.treatmentHistory
          ]
        }));
        setStatusMessage("Treatment history saved in demo mode.");
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        const response = await fetchFastApiJson<ApiPatientIdentityResponse>("/api/patients/me/treatment-history", {
          method: "POST",
          accessToken,
          body: JSON.stringify(newDiagnosis)
        });
        applyResponse(response, "Treatment history entry added.");
      }
      setNewDiagnosis({
        diagnosis: "",
        specialty: "",
        treatment: "",
        notes: "",
        doctor_name: "",
        follow_up_date: ""
      });
      setShowAddDiagnosis(false);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to add treatment history.");
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleDeleteDiagnosis = async (id: string) => {
    try {
      const accessToken = getBrowserAccessToken();
      if (!accessToken || accessToken === DEMO_SESSION_TOKEN) {
        setLocalData((prev) => ({
          ...prev,
          treatmentHistory: prev.treatmentHistory.filter((entry) => entry.id !== id)
        }));
      } else {
        const response = await fetchFastApiJson<ApiPatientIdentityResponse>(
          `/api/patients/me/treatment-history/${encodeURIComponent(id)}`,
          { method: "DELETE", accessToken }
        );
        applyResponse(response, "Treatment history entry deleted.");
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to delete treatment history.");
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/60 bg-white/70 p-6 backdrop-blur">
        {localData.demoMode ? (
          <Badge variant="warning" className="w-fit text-xs">Demo data — connect Supabase for live records</Badge>
        ) : null}
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-700">Medical ID</p>
        <h1 className="font-serif text-3xl text-slate-900 lg:text-4xl">Your medical record</h1>
        <p className="text-sm leading-7 text-slate-500 max-w-2xl">
          Your personal health information, history, and treatment records. Some details may be restricted by your doctor.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" className="border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100" onClick={() => setShowQR(!showQR)}>
            <QrCode className="mr-2 h-4 w-4" />
            {showQR ? "Hide QR Code" : "Show My QR Code"}
          </Button>
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            <Pencil className="mr-2 h-4 w-4" />
            {isEditing ? "Cancel Edit" : "Edit My Info"}
          </Button>
        </div>
        {statusMessage ? (
          <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">
            {statusMessage}
          </div>
        ) : null}
      </div>

      {showQR ? (
        <Card className="border-teal-100 bg-teal-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-teal-700" />
              Your VitalID QR Code
            </CardTitle>
            <CardDescription>
              Doctors can scan this QR code to access your medical information instantly in an emergency.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div ref={qrRef} className="rounded-2xl border-4 border-white bg-white p-4 shadow-md">
              <QRCodeSVG value={qrData} size={200} level="H" includeMargin={false} />
            </div>
            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">QR Code contains:</p>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li>Patient name and blood type</li>
                  <li>Active allergies</li>
                  <li>Current medications</li>
                  <li>Medical conditions</li>
                  <li>Emergency contact</li>
                </ul>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                Full medical history still depends on a verified doctor workflow.
              </div>
              <Button onClick={handleDownloadQR} className="bg-teal-700 hover:bg-teal-800">
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isEditing ? (
        <Card className="border-blue-100 bg-blue-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-700" />
              Edit Your Medical Information
            </CardTitle>
            <CardDescription>
              Update your personal and medical details. Changes will reflect in your QR code and saved profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { id: "fullName", label: "Full Name", type: "text", value: editData.fullName, key: "fullName" },
                { id: "bloodType", label: "Blood Type", type: "text", value: editData.bloodType, key: "bloodType" },
                { id: "dob", label: "Date of Birth", type: "date", value: editData.dob, key: "dob" },
                { id: "emergency", label: "Emergency Contact", type: "text", value: editData.emergencyContact, key: "emergencyContact" },
                { id: "insurance", label: "Insurance Provider", type: "text", value: editData.insuranceProvider, key: "insuranceProvider" }
              ].map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id}>{field.label}</Label>
                  <Input
                    id={field.id}
                    type={field.type}
                    value={field.value}
                    onChange={(e) => setEditData({ ...editData, [field.key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies (comma separated)</Label>
                <Input id="allergies" value={editData.allergies} onChange={(e) => setEditData({ ...editData, allergies: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medications">Medications (comma separated)</Label>
                <Input id="medications" value={editData.medications} onChange={(e) => setEditData({ ...editData, medications: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conditions">Conditions (comma separated)</Label>
                <Input id="conditions" value={editData.conditions} onChange={(e) => setEditData({ ...editData, conditions: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => void handleSave()} className="bg-teal-700 hover:bg-teal-800" disabled={isSaving}>
                <Check className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {fieldPermissions.showTreatmentHistory ? <TabsTrigger value="treatments">Treatment History</TabsTrigger> : null}
          {fieldPermissions.showMedicalHistory ? <TabsTrigger value="history">Medical History</TabsTrigger> : null}
          <TabsTrigger value="records">Vitals History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-teal-50 p-2 text-teal-700"><User className="h-4 w-4" /></div>
                  <CardTitle className="text-base">Personal Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "VitalID", value: vitalId },
                    { label: "Full Name", value: profile.fullName },
                    { label: "Blood Type", value: profile.bloodType },
                    { label: "Date of Birth", value: profile.dob },
                    ...(fieldPermissions.showInsurance ? [{ label: "Insurance", value: profile.insuranceProvider }] : [])
                  ].map((field) => (
                    <div key={field.label} className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">{field.label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 break-all">{field.value}</p>
                    </div>
                  ))}
                </div>
                {fieldPermissions.showEmergencyContact ? (
                  <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-wide text-rose-500">Emergency Contact</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{profile.emergencyContact}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="bg-slate-950 text-white border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white">Live Summary</CardTitle>
                <CardDescription className="text-slate-400">Quick-read card for intake and emergency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400">Patient</p>
                  <p className="text-2xl font-serif font-semibold text-white mt-0.5">{profile.fullName}</p>
                  {fieldPermissions.showInsurance ? <p className="text-sm text-slate-400 mt-0.5">{profile.insuranceProvider}</p> : null}
                </div>
                {fieldPermissions.showVitals && latest ? (
                  <div className="space-y-2 border-t border-white/10 pt-3">
                    {[
                      { label: "Blood Pressure", value: latest.bloodPressure },
                      { label: "Heart Rate", value: `${latest.heartRate} bpm` },
                      { label: "Oxygen", value: `${latest.oxygenSaturation}%` },
                      { label: "Weight", value: `${latest.weightKg} kg` }
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{item.label}</span>
                        <span className="font-semibold text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {(fieldPermissions.showMedications || fieldPermissions.showAllergies || fieldPermissions.showConditions) ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {fieldPermissions.showMedications ? (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-violet-50 p-2 text-violet-700"><Pill className="h-4 w-4" /></div>
                      <CardTitle className="text-base">Medications</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(latest?.medications ?? []).map((item) => (
                      <div key={item} className="flex items-center gap-2 rounded-xl bg-slate-50 border border-border/50 px-3 py-2.5">
                        <div className="h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                        <span className="text-sm text-slate-800">{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
              {fieldPermissions.showAllergies ? (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-amber-50 p-2 text-amber-700"><Activity className="h-4 w-4" /></div>
                      <CardTitle className="text-base">Allergies</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {(latest?.allergies ?? []).map((item) => (
                        <Badge key={item} variant="warning">{item}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null}
              {fieldPermissions.showConditions ? (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-rose-50 p-2 text-rose-700"><FileText className="h-4 w-4" /></div>
                      <CardTitle className="text-base">Conditions</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(latest?.conditions ?? []).map((item) => (
                      <div key={item} className="flex items-center gap-2 rounded-xl bg-slate-50 border border-border/50 px-3 py-2.5">
                        <div className="h-2 w-2 rounded-full bg-rose-400 shrink-0" />
                        <span className="text-sm text-slate-800">{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : null}
        </TabsContent>

        {fieldPermissions.showTreatmentHistory ? (
          <TabsContent value="treatments" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{treatmentHistory.length} record(s)</p>
              <Button size="sm" className="gap-2 bg-teal-700 hover:bg-teal-800" onClick={() => setShowAddDiagnosis(!showAddDiagnosis)}>
                <Plus className="h-4 w-4" />
                Add Treatment Entry
              </Button>
            </div>

            {showAddDiagnosis ? (
              <Card className="border-teal-100 bg-teal-50/40">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Plus className="h-4 w-4 text-teal-700" /> New Treatment Entry
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Diagnosis *</Label>
                      <Input value={newDiagnosis.diagnosis} onChange={(e) => setNewDiagnosis({ ...newDiagnosis, diagnosis: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Specialty</Label>
                      <Input value={newDiagnosis.specialty ?? ""} onChange={(e) => setNewDiagnosis({ ...newDiagnosis, specialty: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Treatment</Label>
                      <Input value={newDiagnosis.treatment ?? ""} onChange={(e) => setNewDiagnosis({ ...newDiagnosis, treatment: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Doctor Name</Label>
                      <Input value={newDiagnosis.doctor_name ?? ""} onChange={(e) => setNewDiagnosis({ ...newDiagnosis, doctor_name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Notes</Label>
                      <Textarea rows={2} value={newDiagnosis.notes ?? ""} onChange={(e) => setNewDiagnosis({ ...newDiagnosis, notes: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Follow-up Date</Label>
                      <Input type="date" value={newDiagnosis.follow_up_date ?? ""} onChange={(e) => setNewDiagnosis({ ...newDiagnosis, follow_up_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => void handleAddDiagnosis()} className="bg-teal-700 hover:bg-teal-800 gap-2" disabled={!newDiagnosis.diagnosis}>
                      <Check className="h-4 w-4" /> Save Entry
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddDiagnosis(false)}>
                      <X className="h-4 w-4 mr-2" /> Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {treatmentHistory.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="pt-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">{entry.specialty}</Badge>
                        {entry.addedBy === "patient" ? (
                          <Badge variant="outline" className="text-teal-700 border-teal-200 bg-teal-50 text-[10px]">Added by you</Badge>
                        ) : null}
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {entry.date}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900">{entry.diagnosis}</p>
                      <p className="text-sm text-slate-600 leading-6">{entry.treatment}</p>
                      {entry.notes ? <p className="text-sm text-slate-500 italic">{entry.notes}</p> : null}
                      {entry.followUp ? <p className="text-xs text-teal-600 font-medium">Follow-up: {entry.followUp}</p> : null}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        <Stethoscope className="h-3.5 w-3.5" /> {entry.doctorName}
                      </span>
                      {entry.addedBy === "patient" ? (
                        <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={() => void handleDeleteDiagnosis(entry.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ) : null}

        {fieldPermissions.showMedicalHistory ? (
          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{medicalHistory.length} record(s)</p>
              <Button size="sm" className="gap-2 bg-teal-700 hover:bg-teal-800" onClick={() => setShowAddMedicalHistory(!showAddMedicalHistory)}>
                <Plus className="h-4 w-4" />
                Add Medical History
              </Button>
            </div>

            {showAddMedicalHistory ? (
              <Card className="border-blue-100 bg-blue-50/40">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Plus className="h-4 w-4 text-blue-700" /> New Medical History Entry
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Type</Label>
                      <select
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        value={newMedicalHistory.event_type}
                        onChange={(e) => setNewMedicalHistory({ ...newMedicalHistory, event_type: e.target.value })}
                      >
                        {HISTORY_TYPES.map((type) => <option key={type}>{type}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date *</Label>
                      <Input type="date" value={newMedicalHistory.event_date} onChange={(e) => setNewMedicalHistory({ ...newMedicalHistory, event_date: e.target.value })} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Title *</Label>
                      <Input value={newMedicalHistory.title} onChange={(e) => setNewMedicalHistory({ ...newMedicalHistory, title: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Doctor Name</Label>
                      <Input value={newMedicalHistory.doctor_name ?? ""} onChange={(e) => setNewMedicalHistory({ ...newMedicalHistory, doctor_name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Facility</Label>
                      <Input value={newMedicalHistory.facility ?? ""} onChange={(e) => setNewMedicalHistory({ ...newMedicalHistory, facility: e.target.value })} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Description</Label>
                      <Textarea rows={2} value={newMedicalHistory.description ?? ""} onChange={(e) => setNewMedicalHistory({ ...newMedicalHistory, description: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => void handleAddMedicalHistory()} className="bg-teal-700 hover:bg-teal-800 gap-2" disabled={!newMedicalHistory.title || !newMedicalHistory.event_date}>
                      <Check className="h-4 w-4" /> Save Entry
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddMedicalHistory(false)}>
                      <X className="h-4 w-4 mr-2" /> Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {medicalHistory.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="pt-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${historyTypeColor[entry.type] ?? "bg-slate-100 text-slate-700"}`}>
                          {entry.type}
                        </span>
                        {entry.addedBy === "patient" ? (
                          <Badge variant="outline" className="text-teal-700 border-teal-200 bg-teal-50 text-[10px]">Added by you</Badge>
                        ) : null}
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {entry.date}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900">{entry.title}</p>
                      {entry.description ? <p className="text-sm text-slate-600 leading-6">{entry.description}</p> : null}
                    </div>
                    <div className="flex items-start gap-3 shrink-0">
                      <div className="space-y-1 text-right">
                        <p className="text-sm text-slate-500 flex items-center gap-1 justify-end">
                          <Stethoscope className="h-3.5 w-3.5" /> {entry.doctorName}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                          <Building2 className="h-3 w-3" /> {entry.facility}
                        </p>
                      </div>
                      {entry.addedBy === "patient" ? (
                        <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={() => void handleDeleteMedicalHistory(entry.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ) : null}

        <TabsContent value="records" className="space-y-4">
          {medicalRecords.map((record, index) => (
            <Card key={record.id}>
              <CardContent className="pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">{formatDate(record.recordedAt)}</p>
                  {index === 0 ? <Badge variant="success">Latest</Badge> : null}
                </div>
                {fieldPermissions.showVitals ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { label: "Blood Pressure", value: record.bloodPressure },
                      { label: "Heart Rate", value: `${record.heartRate} bpm` },
                      { label: "O2 Sat", value: `${record.oxygenSaturation}%` },
                      { label: "Temperature", value: record.temperature }
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">{item.label}</p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">{item.value}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </>
  );
}
