"use client";

import { Search, LoaderCircle } from "lucide-react";
import { type FormEvent, useState } from "react";

import { NotesAnalyzer } from "@/components/dashboard/notes-analyzer";
import { PatternDetector } from "@/components/dashboard/pattern-detector";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type ApiPatientFullProfileResponse,
  type PatientLookupData,
  fetchFastApiJson,
  getBrowserAccessToken,
  mapApiPatientFullProfileToLookup
} from "@/lib/fastapi";
import { mockDashboardData } from "@/lib/mock-data";
import { DEMO_SESSION_TOKEN } from "@/lib/supabase/client";

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

export function DoctorAiTools() {
  const [patientId, setPatientId] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientLookupData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!patientId.trim()) {
        throw new Error("Enter a patient ID before running AI tools.");
      }

      const accessToken = getBrowserAccessToken();
      if (!accessToken || accessToken === DEMO_SESSION_TOKEN) {
        setSelectedPatient(createDemoPatientLookup());
        return;
      }

      const data = await fetchFastApiJson<ApiPatientFullProfileResponse>(
        `/api/patients/lookup/${encodeURIComponent(patientId.trim())}`,
        {
          accessToken
        }
      );

      setSelectedPatient(mapApiPatientFullProfileToLookup(data));
    } catch (caughtError) {
      setSelectedPatient(null);
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to load patient context."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Patient Context</CardTitle>
          <CardDescription>
            Select a patient by their Vital ID to load clinical context for notes analysis and pattern detection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={handleLookup}>
            <div className="flex-1 space-y-2">
              <Label htmlFor="ai-patient-id">Patient ID / Vital ID</Label>
              <Input
                id="ai-patient-id"
                value={patientId}
                onChange={(event) => setPatientId(event.target.value)}
                placeholder="Enter VitalID or patient UUID"
              />
            </div>
            <Button type="submit" className="gap-2" disabled={loading}>
              {loading ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Loading patient
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Load patient
                </>
              )}
            </Button>
          </form>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          {selectedPatient ? (
            <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-900">
              Loaded <span className="font-semibold">{selectedPatient.profile.fullName}</span> with{" "}
              <span className="font-semibold">{selectedPatient.medicalRecords.length}</span> record(s).
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Choose a patient first. The AI tools are patient-scoped in the merged backend.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <NotesAnalyzer selectedPatient={selectedPatient} />
        <PatternDetector selectedPatient={selectedPatient} />
      </div>
    </div>
  );
}
