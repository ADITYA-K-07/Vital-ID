"use client";

import { Activity, FileText, Pill, Stethoscope, Calendar, Building2, User, QrCode, Pencil, Download, X, Check, Plus, Trash2 } from "lucide-react";
import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

// Local types for patient-added entries
interface PatientMedicalHistoryEntry {
  id: string;
  type: string;
  title: string;
  date: string;
  description: string;
  facility: string;
  doctorName: string;
}

interface PatientDiagnosisEntry {
  id: string;
  date: string;
  diagnosis: string;
  specialty: string;
  treatment: string;
  notes: string;
  doctorName: string;
  followUp: string;
}

export function PatientMedicalID({ data }: { data: DashboardData }) {
  const { profile, medicalRecords, treatmentHistory, medicalHistory, fieldPermissions } = data;
  const latest = medicalRecords[0];
  const qrRef = useRef<HTMLDivElement>(null);

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: profile.fullName,
    bloodType: profile.bloodType,
    dob: profile.dob,
    emergencyContact: profile.emergencyContact,
    insuranceProvider: profile.insuranceProvider,
    allergies: latest?.allergies.join(", ") ?? "",
    medications: latest?.medications.join(", ") ?? "",
    conditions: latest?.conditions.join(", ") ?? "",
  });
  const [savedData, setSavedData] = useState(editData);
  const [showQR, setShowQR] = useState(false);

  // Patient-added medical history
  const [patientMedicalHistory, setPatientMedicalHistory] = useState<PatientMedicalHistoryEntry[]>([]);
  const [showAddMedicalHistory, setShowAddMedicalHistory] = useState(false);
  const [newMedicalHistory, setNewMedicalHistory] = useState<Omit<PatientMedicalHistoryEntry, "id">>({
    type: "Diagnosis",
    title: "",
    date: "",
    description: "",
    facility: "",
    doctorName: "",
  });

  // Patient-added diagnosis history
  const [patientDiagnosisHistory, setPatientDiagnosisHistory] = useState<PatientDiagnosisEntry[]>([]);
  const [showAddDiagnosis, setShowAddDiagnosis] = useState(false);
  const [newDiagnosis, setNewDiagnosis] = useState<Omit<PatientDiagnosisEntry, "id">>({
    date: "",
    diagnosis: "",
    specialty: "",
    treatment: "",
    notes: "",
    doctorName: "",
    followUp: "",
  });

  // QR code data
  const qrData = JSON.stringify({
    name: savedData.fullName,
    bloodType: savedData.bloodType,
    dob: savedData.dob,
    emergencyContact: savedData.emergencyContact,
    allergies: savedData.allergies,
    medications: savedData.medications,
    conditions: savedData.conditions,
    vitalId: profile.id,
    generatedAt: new Date().toISOString()
  });

  const handleSave = () => {
    setSavedData(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(savedData);
    setIsEditing(false);
  };

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VitalID-${savedData.fullName.replace(" ", "-")}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddMedicalHistory = () => {
    if (!newMedicalHistory.title || !newMedicalHistory.date) return;
    setPatientMedicalHistory((prev) => [
      { ...newMedicalHistory, id: `patient-mh-${Date.now()}` },
      ...prev,
    ]);
    setNewMedicalHistory({ type: "Diagnosis", title: "", date: "", description: "", facility: "", doctorName: "" });
    setShowAddMedicalHistory(false);
  };

  const handleDeleteMedicalHistory = (id: string) => {
    setPatientMedicalHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const handleAddDiagnosis = () => {
    if (!newDiagnosis.diagnosis || !newDiagnosis.date) return;
    setPatientDiagnosisHistory((prev) => [
      { ...newDiagnosis, id: `patient-dx-${Date.now()}` },
      ...prev,
    ]);
    setNewDiagnosis({ date: "", diagnosis: "", specialty: "", treatment: "", notes: "", doctorName: "", followUp: "" });
    setShowAddDiagnosis(false);
  };

  const handleDeleteDiagnosis = (id: string) => {
    setPatientDiagnosisHistory((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <>
      {/* Page header */}
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/60 bg-white/70 p-6 backdrop-blur">
        {data.demoMode && (
          <Badge variant="warning" className="w-fit text-xs">Demo data — connect Supabase for live records</Badge>
        )}
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-700">Medical ID</p>
        <h1 className="font-serif text-3xl text-slate-900 lg:text-4xl">Your medical record</h1>
        <p className="text-sm leading-7 text-slate-500 max-w-2xl">
          Your personal health information, history, and treatment records. Some details may be restricted by your doctor.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            className="border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100"
            onClick={() => setShowQR(!showQR)}
          >
            <QrCode className="mr-2 h-4 w-4" />
            {showQR ? "Hide QR Code" : "Show My QR Code"}
          </Button>
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            <Pencil className="mr-2 h-4 w-4" />
            {isEditing ? "Cancel Edit" : "Edit My Info"}
          </Button>
        </div>
      </div>

      {/* QR Code Section */}
      {showQR && (
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
              <QRCodeSVG
                value={qrData}
                size={200}
                level="H"
                includeMargin={false}
                imageSettings={{ src: "", height: 0, width: 0, excavate: false }}
              />
            </div>
            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">QR Code contains:</p>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> Patient name & blood type</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> Active allergies</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> Current medications</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> Medical conditions</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> Emergency contact</li>
                </ul>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                🔒 Full medical history requires doctor licence verification to access
              </div>
              <Button onClick={handleDownloadQR} className="bg-teal-700 hover:bg-teal-800">
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form Section */}
      {isEditing && (
        <Card className="border-blue-100 bg-blue-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-700" />
              Edit Your Medical Information
            </CardTitle>
            <CardDescription>
              Update your personal and medical details. Changes will reflect in your QR code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { id: "fullName", label: "Full Name", type: "text", value: editData.fullName, key: "fullName" },
                { id: "bloodType", label: "Blood Type", type: "text", value: editData.bloodType, key: "bloodType" },
                { id: "dob", label: "Date of Birth", type: "date", value: editData.dob, key: "dob" },
                { id: "emergency", label: "Emergency Contact", type: "text", value: editData.emergencyContact, key: "emergencyContact" },
                { id: "insurance", label: "Insurance Provider", type: "text", value: editData.insuranceProvider, key: "insuranceProvider" },
              ].map((f) => (
                <div key={f.id} className="space-y-2">
                  <Label htmlFor={f.id}>{f.label}</Label>
                  <Input
                    id={f.id}
                    type={f.type}
                    value={f.value}
                    onChange={(e) => setEditData({ ...editData, [f.key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies (comma separated)</Label>
                <Input id="allergies" placeholder="e.g. Penicillin, Dust, Peanuts" value={editData.allergies} onChange={(e) => setEditData({ ...editData, allergies: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medications">Medications (comma separated)</Label>
                <Input id="medications" placeholder="e.g. Montelukast, Budesonide" value={editData.medications} onChange={(e) => setEditData({ ...editData, medications: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conditions">Conditions (comma separated)</Label>
                <Input id="conditions" placeholder="e.g. Asthma, Hypertension" value={editData.conditions} onChange={(e) => setEditData({ ...editData, conditions: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button onClick={handleSave} className="bg-teal-700 hover:bg-teal-800">
                <Check className="mr-2 h-4 w-4" /> Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {fieldPermissions.showTreatmentHistory && <TabsTrigger value="treatments">Treatment History</TabsTrigger>}
          {fieldPermissions.showMedicalHistory && <TabsTrigger value="history">Medical History</TabsTrigger>}
          <TabsTrigger value="records">Vitals History</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
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
                    { label: "Full Name", value: savedData.fullName },
                    { label: "Blood Type", value: savedData.bloodType },
                    { label: "Date of Birth", value: savedData.dob },
                    ...(fieldPermissions.showInsurance ? [{ label: "Insurance", value: savedData.insuranceProvider }] : [])
                  ].map((f) => (
                    <div key={f.label} className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">{f.label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{f.value}</p>
                    </div>
                  ))}
                </div>
                {fieldPermissions.showEmergencyContact && (
                  <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-wide text-rose-500">Emergency Contact</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{savedData.emergencyContact}</p>
                  </div>
                )}
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
                  <p className="text-2xl font-serif font-semibold text-white mt-0.5">{savedData.fullName}</p>
                  {fieldPermissions.showInsurance && <p className="text-sm text-slate-400 mt-0.5">{savedData.insuranceProvider}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Blood Group</p>
                    <p className="mt-1 text-lg font-bold text-white">{savedData.bloodType}</p>
                  </div>
                  {fieldPermissions.showAllergies && (
                    <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Active Allergies</p>
                      <p className="mt-1 text-lg font-bold text-white">{savedData.allergies.split(",").filter(Boolean).length}</p>
                    </div>
                  )}
                  {fieldPermissions.showMedications && (
                    <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Medications</p>
                      <p className="mt-1 text-lg font-bold text-white">{savedData.medications.split(",").filter(Boolean).length}</p>
                    </div>
                  )}
                  {fieldPermissions.showConditions && (
                    <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Conditions</p>
                      <p className="mt-1 text-lg font-bold text-white">{savedData.conditions.split(",").filter(Boolean).length}</p>
                    </div>
                  )}
                </div>
                {fieldPermissions.showVitals && latest && (
                  <div className="space-y-2 border-t border-white/10 pt-3">
                    {[
                      { label: "Blood Pressure", value: latest.bloodPressure },
                      { label: "Heart Rate", value: `${latest.heartRate} bpm` },
                      { label: "Oxygen", value: `${latest.oxygenSaturation}%` },
                      { label: "Weight", value: `${latest.weightKg} kg` }
                    ].map((v) => (
                      <div key={v.label} className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{v.label}</span>
                        <span className="font-semibold text-white">{v.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {(fieldPermissions.showMedications || fieldPermissions.showAllergies || fieldPermissions.showConditions) && (
            <div className="grid gap-6 lg:grid-cols-3">
              {fieldPermissions.showMedications && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-violet-50 p-2 text-violet-700"><Pill className="h-4 w-4" /></div>
                      <CardTitle className="text-base">Medications</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {savedData.medications.split(",").filter(Boolean).map((m, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-50 border border-border/50 px-3 py-2.5">
                        <div className="h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                        <span className="text-sm text-slate-800">{m.trim()}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              {fieldPermissions.showAllergies && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-amber-50 p-2 text-amber-700"><Activity className="h-4 w-4" /></div>
                      <CardTitle className="text-base">Allergies</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {savedData.allergies.split(",").filter(Boolean).map((a) => (
                        <Badge key={a} variant="warning">{a.trim()}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {fieldPermissions.showConditions && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-rose-50 p-2 text-rose-700"><FileText className="h-4 w-4" /></div>
                      <CardTitle className="text-base">Conditions</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {savedData.conditions.split(",").filter(Boolean).map((c, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-50 border border-border/50 px-3 py-2.5">
                        <div className="h-2 w-2 rounded-full bg-rose-400 shrink-0" />
                        <span className="text-sm text-slate-800">{c.trim()}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Treatment / Diagnosis History tab */}
        {fieldPermissions.showTreatmentHistory && (
          <TabsContent value="treatments" className="space-y-4">
            {/* Add Diagnosis button */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{treatmentHistory.length + patientDiagnosisHistory.length} record(s)</p>
              <Button
                size="sm"
                className="gap-2 bg-teal-700 hover:bg-teal-800"
                onClick={() => setShowAddDiagnosis(!showAddDiagnosis)}
              >
                <Plus className="h-4 w-4" />
                Add Diagnosis
              </Button>
            </div>

            {/* Add Diagnosis form */}
            {showAddDiagnosis && (
              <Card className="border-teal-100 bg-teal-50/40">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Plus className="h-4 w-4 text-teal-700" /> New Diagnosis Entry
                  </CardTitle>
                  <CardDescription>Add a diagnosis record to your history</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Diagnosis *</Label>
                      <Input placeholder="e.g. Type 2 Diabetes" value={newDiagnosis.diagnosis} onChange={(e) => setNewDiagnosis({ ...newDiagnosis, diagnosis: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date *</Label>
                      <Input type="date" value={newDiagnosis.date} onChange={(e) => setNewDiagnosis({ ...newDiagnosis, date: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Specialty</Label>
                      <Input placeholder="e.g. Endocrinology" value={newDiagnosis.specialty} onChange={(e) => setNewDiagnosis({ ...newDiagnosis, specialty: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Doctor Name</Label>
                      <Input placeholder="e.g. Dr. Sharma" value={newDiagnosis.doctorName} onChange={(e) => setNewDiagnosis({ ...newDiagnosis, doctorName: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Treatment</Label>
                      <Input placeholder="e.g. Metformin 500mg" value={newDiagnosis.treatment} onChange={(e) => setNewDiagnosis({ ...newDiagnosis, treatment: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Follow-up</Label>
                      <Input placeholder="e.g. 3 months" value={newDiagnosis.followUp} onChange={(e) => setNewDiagnosis({ ...newDiagnosis, followUp: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Notes</Label>
                    <Textarea placeholder="Any additional notes..." rows={2} value={newDiagnosis.notes} onChange={(e) => setNewDiagnosis({ ...newDiagnosis, notes: e.target.value })} />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleAddDiagnosis} className="bg-teal-700 hover:bg-teal-800 gap-2" disabled={!newDiagnosis.diagnosis || !newDiagnosis.date}>
                      <Check className="h-4 w-4" /> Save Entry
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddDiagnosis(false)}>
                      <X className="h-4 w-4 mr-2" /> Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Patient-added entries */}
            {patientDiagnosisHistory.map((d) => (
              <Card key={d.id} className="border-teal-100">
                <CardContent className="pt-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">{d.specialty || "General"}</Badge>
                        <Badge variant="outline" className="text-teal-700 border-teal-200 bg-teal-50 text-[10px]">Added by you</Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {d.date}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900">{d.diagnosis}</p>
                      {d.treatment && <p className="text-sm text-slate-600 leading-6">{d.treatment}</p>}
                      {d.notes && <p className="text-sm text-slate-500 italic">{d.notes}</p>}
                      {d.followUp && <p className="text-xs text-teal-600 font-medium">Follow-up: {d.followUp}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {d.doctorName && (
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                          <Stethoscope className="h-3.5 w-3.5" /> {d.doctorName}
                        </span>
                      )}
                      <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleDeleteDiagnosis(d.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Original treatment history */}
            {treatmentHistory.map((t) => (
              <Card key={t.id}>
                <CardContent className="pt-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">{t.specialty}</Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {t.date}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900">{t.diagnosis}</p>
                      <p className="text-sm text-slate-600 leading-6">{t.treatment}</p>
                      {t.notes && <p className="text-sm text-slate-500 italic">{t.notes}</p>}
                      {t.followUp && <p className="text-xs text-teal-600 font-medium">Follow-up: {t.followUp}</p>}
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 text-sm text-slate-500">
                      <Stethoscope className="h-3.5 w-3.5" /> {t.doctorName}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}

        {/* Medical History tab */}
        {fieldPermissions.showMedicalHistory && (
          <TabsContent value="history" className="space-y-4">
            {/* Add Medical History button */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{medicalHistory.length + patientMedicalHistory.length} record(s)</p>
              <Button
                size="sm"
                className="gap-2 bg-teal-700 hover:bg-teal-800"
                onClick={() => setShowAddMedicalHistory(!showAddMedicalHistory)}
              >
                <Plus className="h-4 w-4" />
                Add Medical History
              </Button>
            </div>

            {/* Add Medical History form */}
            {showAddMedicalHistory && (
              <Card className="border-blue-100 bg-blue-50/40">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Plus className="h-4 w-4 text-blue-700" /> New Medical History Entry
                  </CardTitle>
                  <CardDescription>Add a past medical event to your record</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Type</Label>
                      <select
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        value={newMedicalHistory.type}
                        onChange={(e) => setNewMedicalHistory({ ...newMedicalHistory, type: e.target.value })}
                      >
                        {HISTORY_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date *</Label>
                      <Input type="date" value={newMedicalHistory.date} onChange={(e) => setNewMedicalHistory({ ...newMedicalHistory, date: e.target.value })} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Title *</Label>
                      <Input placeholder="e.g. Appendectomy" value={newMedicalHistory.title} onChange={(e) => setNewMedicalHistory({ ...newMedicalHistory, title: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Doctor Name</Label>
                      <Input placeholder="e.g. Dr. Mehta" value={newMedicalHistory.doctorName} onChange={(e) => setNewMedicalHistory({ ...newMedicalHistory, doctorName: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Facility / Hospital</Label>
                      <Input placeholder="e.g. Ruby Hall Clinic" value={newMedicalHistory.facility} onChange={(e) => setNewMedicalHistory({ ...newMedicalHistory, facility: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea placeholder="Describe what happened, outcome, recovery, etc." rows={2} value={newMedicalHistory.description} onChange={(e) => setNewMedicalHistory({ ...newMedicalHistory, description: e.target.value })} />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleAddMedicalHistory} className="bg-teal-700 hover:bg-teal-800 gap-2" disabled={!newMedicalHistory.title || !newMedicalHistory.date}>
                      <Check className="h-4 w-4" /> Save Entry
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddMedicalHistory(false)}>
                      <X className="h-4 w-4 mr-2" /> Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Patient-added entries */}
            {patientMedicalHistory.map((h) => (
              <Card key={h.id} className="border-blue-100">
                <CardContent className="pt-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${historyTypeColor[h.type] ?? "bg-slate-100 text-slate-700"}`}>
                          {h.type}
                        </span>
                        <Badge variant="outline" className="text-teal-700 border-teal-200 bg-teal-50 text-[10px]">Added by you</Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {h.date}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900">{h.title}</p>
                      {h.description && <p className="text-sm text-slate-600 leading-6">{h.description}</p>}
                    </div>
                    <div className="flex items-start gap-3 shrink-0">
                      <div className="space-y-1 text-right">
                        {h.doctorName && (
                          <p className="text-sm text-slate-500 flex items-center gap-1 justify-end">
                            <Stethoscope className="h-3.5 w-3.5" /> {h.doctorName}
                          </p>
                        )}
                        {h.facility && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                            <Building2 className="h-3 w-3" /> {h.facility}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleDeleteMedicalHistory(h.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Original medical history */}
            {medicalHistory.map((h) => (
              <Card key={h.id}>
                <CardContent className="pt-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${historyTypeColor[h.type] ?? "bg-slate-100 text-slate-700"}`}>
                          {h.type}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {h.date}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900">{h.title}</p>
                      <p className="text-sm text-slate-600 leading-6">{h.description}</p>
                    </div>
                    <div className="shrink-0 space-y-1 text-right">
                      <p className="text-sm text-slate-500 flex items-center gap-1 justify-end">
                        <Stethoscope className="h-3.5 w-3.5" /> {h.doctorName}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                        <Building2 className="h-3 w-3" /> {h.facility}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}

        {/* Vitals history */}
        <TabsContent value="records" className="space-y-4">
          {medicalRecords.map((r, i) => (
            <Card key={r.id}>
              <CardContent className="pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">{formatDate(r.recordedAt)}</p>
                  {i === 0 && <Badge variant="success">Latest</Badge>}
                </div>
                {fieldPermissions.showVitals && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { label: "Blood Pressure", value: r.bloodPressure },
                      { label: "Heart Rate", value: `${r.heartRate} bpm` },
                      { label: "O₂ Sat", value: `${r.oxygenSaturation}%` },
                      { label: "Temperature", value: r.temperature }
                    ].map((v) => (
                      <div key={v.label} className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">{v.label}</p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">{v.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </>
  );
}