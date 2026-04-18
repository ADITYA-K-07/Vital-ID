"use client";

import { Activity, FileText, Pill, Stethoscope, Calendar, Building2, User } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import type { DashboardData } from "@/types";

const historyTypeColor: Record<string, string> = {
  Surgery: "bg-rose-100 text-rose-700 border-rose-200",
  Hospitalization: "bg-amber-100 text-amber-700 border-amber-200",
  Diagnosis: "bg-blue-100 text-blue-700 border-blue-200",
  Procedure: "bg-violet-100 text-violet-700 border-violet-200",
  Vaccination: "bg-teal-100 text-teal-700 border-teal-200"
};

export function PatientMedicalID({ data }: { data: DashboardData }) {
  const { profile, medicalRecords, treatmentHistory, medicalHistory, fieldPermissions } = data;
  const latest = medicalRecords[0];

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
      </div>

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
            {/* Basic info */}
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
                    { label: "Full Name", value: profile.fullName },
                    { label: "Blood Type", value: profile.bloodType },
                    { label: "Date of Birth", value: profile.dob },
                    ...(fieldPermissions.showInsurance ? [{ label: "Insurance", value: profile.insuranceProvider }] : [])
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
                    <p className="mt-1 text-sm font-semibold text-slate-900">{profile.emergencyContact}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Live summary card */}
            <Card className="bg-slate-950 text-white border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white">Live Summary</CardTitle>
                <CardDescription className="text-slate-400">Quick-read card for intake and emergency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400">Patient</p>
                  <p className="text-2xl font-serif font-semibold text-white mt-0.5">{profile.fullName}</p>
                  {fieldPermissions.showInsurance && <p className="text-sm text-slate-400 mt-0.5">{profile.insuranceProvider}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Blood Group</p>
                    <p className="mt-1 text-lg font-bold text-white">{profile.bloodType}</p>
                  </div>
                  {fieldPermissions.showAllergies && latest && (
                    <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Active Allergies</p>
                      <p className="mt-1 text-lg font-bold text-white">{latest.allergies.length}</p>
                    </div>
                  )}
                  {fieldPermissions.showMedications && latest && (
                    <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Medications</p>
                      <p className="mt-1 text-lg font-bold text-white">{latest.medications.length}</p>
                    </div>
                  )}
                  {fieldPermissions.showConditions && latest && (
                    <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Conditions</p>
                      <p className="mt-1 text-lg font-bold text-white">{latest.conditions.length}</p>
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

          {/* Medications & allergies */}
          {(fieldPermissions.showMedications || fieldPermissions.showAllergies || fieldPermissions.showConditions) && latest && (
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
                    {latest.medications.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-50 border border-border/50 px-3 py-2.5">
                        <div className="h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                        <span className="text-sm text-slate-800">{m}</span>
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
                      {latest.allergies.map((a) => <Badge key={a} variant="warning">{a}</Badge>)}
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
                    {latest.conditions.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-50 border border-border/50 px-3 py-2.5">
                        <div className="h-2 w-2 rounded-full bg-rose-400 shrink-0" />
                        <span className="text-sm text-slate-800">{c}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Treatment History */}
        {fieldPermissions.showTreatmentHistory && (
          <TabsContent value="treatments" className="space-y-4">
            {data.treatmentHistory.map((t) => (
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
                      {t.followUp && (
                        <p className="text-xs text-teal-600 font-medium">Follow-up: {t.followUp}</p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 text-sm text-slate-500">
                      <Stethoscope className="h-3.5 w-3.5" />
                      {t.doctorName}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}

        {/* Medical History */}
        {fieldPermissions.showMedicalHistory && (
          <TabsContent value="history" className="space-y-4">
            {data.medicalHistory.map((h) => (
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