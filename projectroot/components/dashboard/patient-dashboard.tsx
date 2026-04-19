"use client";

import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Pill,
  User,
  LogOut,
  Info,
  Download
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import {
  AUTH_COOKIE_NAME,
  AUTH_LICENSE_COOKIE_NAME,
  AUTH_LICENSE_VERIFIED_COOKIE_NAME,
  AUTH_ROLE_COOKIE_NAME,
  createBrowserSupabaseClient
} from "@/lib/supabase/client";
import type { DashboardData } from "@/types";

interface PatientDashboardProps {
  data: DashboardData;
}

export function PatientDashboard({ data }: PatientDashboardProps) {
  const router = useRouter();
  const { profile, consultations, medicalRecords, alerts, fieldPermissions } = data;
  const latestRecord = medicalRecords[0];
  const qrRef = useRef<HTMLDivElement>(null);

  const vitalIdNumber = profile.vitalId ?? `VID-${profile.id.slice(-6).toUpperCase()}`;

  const qrData = JSON.stringify({
    vitalId: vitalIdNumber,
    name: profile.fullName,
    bloodType: profile.bloodType,
    dob: profile.dob,
    emergencyContact: profile.emergencyContact,
    allergies: latestRecord?.allergies ?? [],
    medications: latestRecord?.medications ?? [],
    conditions: latestRecord?.conditions ?? [],
  });

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VitalID-${profile.fullName.replace(" ", "-")}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  const alertIcon = (type: string) => {
    if (type === "critical") return <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />;
    if (type === "warning") return <Bell className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
    return <Info className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />;
  };

  const alertBg = (type: string) => {
    if (type === "critical") return "border-rose-200 bg-rose-50";
    if (type === "warning") return "border-amber-200 bg-amber-50";
    return "border-teal-200 bg-teal-50";
  };

  return (
    <>
      {/* Page header */}
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/60 bg-white/70 p-6 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div>
          {data.demoMode && (
            <Badge variant="warning" className="mb-3 w-fit text-xs">
              Demo data — connect Supabase for live records
            </Badge>
          )}
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-700">Dashboard Overview</p>
          <h1 className="mt-1 font-serif text-3xl text-slate-900 lg:text-4xl">Your medical dashboard</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            Your upcoming appointments, alerts, and health snapshot at a glance.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="w-fit gap-2">
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Alerts & Reminders</h2>
          <div className="flex flex-col gap-2">
            {alerts.map((alert) => (
              <div key={alert.id} className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${alertBg(alert.type)}`}>
                {alertIcon(alert.type)}
                <p className="text-sm text-slate-700">{alert.message}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Patient details + QR */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-teal-50 p-2 text-teal-700">
                <User className="h-4 w-4" />
              </div>
              <CardTitle className="text-base">Patient Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Full Name</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{profile.fullName}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Blood Type</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{profile.bloodType}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Date of Birth</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{profile.dob}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Insurance</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{profile.insuranceProvider}</p>
              </div>
            </div>

            {fieldPermissions.showEmergencyContact && (
              <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wide text-rose-500">Emergency Contact</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{profile.emergencyContact}</p>
              </div>
            )}

            {/* Always visible QR Code */}
            <div className="rounded-xl border border-teal-100 bg-teal-50/50 px-4 py-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div ref={qrRef} className="rounded-xl bg-white p-3 shadow-md shrink-0">
                  <QRCodeSVG value={qrData} size={140} level="H" />
                </div>
                <div className="flex flex-col gap-2 text-center sm:text-left">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-teal-600">Your VitalID Number</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 tracking-widest font-mono">{vitalIdNumber}</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-5">
                    Show this QR code to any doctor for instant emergency access to your medical profile.
                  </p>
                  <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    🔒 Full history requires doctor licence + your password
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-teal-200 text-teal-700 hover:bg-teal-50 w-fit"
                    onClick={handleDownloadQR}
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Download QR
                  </Button>
                </div>
              </div>
            </div>

            {latestRecord && fieldPermissions.showVitals && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { label: "BP", value: latestRecord.bloodPressure },
                  { label: "Heart Rate", value: `${latestRecord.heartRate} bpm` },
                  { label: "O₂ Sat", value: `${latestRecord.oxygenSaturation}%` }
                ].map((v) => (
                  <div key={v.label} className="rounded-xl bg-teal-50 border border-teal-100 px-3 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-teal-600">{v.label}</p>
                    <p className="mt-0.5 text-sm font-bold text-teal-900">{v.value}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current medications */}
        {fieldPermissions.showMedications && latestRecord && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-violet-50 p-2 text-violet-700">
                  <Pill className="h-4 w-4" />
                </div>
                <CardTitle className="text-base">Current Medications</CardTitle>
              </div>
              <CardDescription>Active prescriptions from your latest record</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {latestRecord.medications.length > 0 ? (
                latestRecord.medications.map((med, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-border/60 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-teal-500" />
                      <p className="text-sm font-medium text-slate-900">{med}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">Active</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No current medications on record.</p>
              )}
              {fieldPermissions.showAllergies && latestRecord.allergies.length > 0 && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-amber-600 mb-2">Known Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {latestRecord.allergies.map((a) => (
                      <Badge key={a} variant="warning">{a}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming appointments */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
              <CalendarClock className="h-4 w-4" />
            </div>
            <CardTitle className="text-base">Upcoming Appointments</CardTitle>
          </div>
          <CardDescription>Your confirmed and scheduled consultations</CardDescription>
        </CardHeader>
        <CardContent>
          {consultations.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {consultations.map((c) => (
                <div key={c.id} className="rounded-2xl border border-border/70 bg-slate-50/70 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{c.title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{c.specialist}</p>
                    </div>
                    <Badge variant={c.status === "Confirmed" ? "success" : c.status === "Pending" ? "warning" : "secondary"}>
                      {c.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <CalendarClock className="h-3.5 w-3.5" />
                    <span>{formatDateTime(c.date)}</span>
                    <span className="mx-1">·</span>
                    <span>{c.mode}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No upcoming appointments scheduled.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
