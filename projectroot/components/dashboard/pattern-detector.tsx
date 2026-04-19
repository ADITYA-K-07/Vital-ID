"use client";

import { Activity, LoaderCircle, Sparkles } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ApiPatternDetectResponse,
  type PatientLookupData,
  fetchFastApiJson,
  getBrowserAccessToken
} from "@/lib/fastapi";
import { DEMO_SESSION_TOKEN } from "@/lib/supabase/client";

interface PatternDetectorProps {
  selectedPatient: PatientLookupData | null;
}

function buildDemoPatternResult(patientName: string, recordCount: number): ApiPatternDetectResponse {
  return {
    patterns: [
      "Repeated monitoring snapshots show a stable chronic-condition history.",
      "Medication mentions appear across the recent timeline."
    ],
    risk_flags: [
      { flag: "Needs clinician review if symptoms recur", color: "yellow" }
    ],
    recommendations: [
      "Compare the latest record against the prior visit trend.",
      "Confirm adherence to current medications and follow-up schedule."
    ],
    summary: `${patientName} has ${recordCount} recent record(s) available for longitudinal review.`
  };
}

export function PatternDetector({ selectedPatient }: PatternDetectorProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiPatternDetectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDetect = async () => {
    if (!selectedPatient) return;

    setLoading(true);
    setResult(null);
    setError(null);

    const formattedRecords = selectedPatient.medicalRecords.map((record) => ({
      date: record.recordedAt,
      condition: record.conditions.join(", ") || "General checkup",
      notes: `BP: ${record.bloodPressure}, HR: ${record.heartRate}bpm, O2: ${record.oxygenSaturation}%, Meds: ${record.medications.join(", ")}`
    }));

    try {
      const accessToken = getBrowserAccessToken();
      if (!accessToken || accessToken === DEMO_SESSION_TOKEN) {
        setResult(
          buildDemoPatternResult(
            selectedPatient.profile.fullName,
            selectedPatient.medicalRecords.length
          )
        );
        return;
      }

      const data = await fetchFastApiJson<ApiPatternDetectResponse>("/api/patterns/detect", {
        method: "POST",
        accessToken,
        body: JSON.stringify({
          patient_id: selectedPatient.patientId,
          patient_name: selectedPatient.profile.fullName,
          records: formattedRecords
        })
      });

      setResult(data);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to detect patterns. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-teal-700" />
          AI Pattern Detection
        </CardTitle>
        <CardDescription>
          Analyze health records over time to detect trends, risk flags, and get recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-border/70 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
          {selectedPatient ? (
            <>
              Analyzing{" "}
              <span className="font-semibold text-slate-900">
                {selectedPatient.medicalRecords.length} health record(s)
              </span>{" "}
              for{" "}
              <span className="font-semibold text-slate-900">
                {selectedPatient.profile.fullName}
              </span>
            </>
          ) : (
            "Select a patient to unlock pattern detection."
          )}
        </div>

        <Button
          type="button"
          className="w-full bg-teal-700 hover:bg-teal-800"
          onClick={handleDetect}
          disabled={loading || !selectedPatient}
        >
          {loading ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Detecting patterns...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Detect Health Patterns
            </>
          )}
        </Button>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {result && (
          <div className="rounded-3xl border border-teal-100 bg-teal-50/60 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-700" />
              <p className="font-semibold text-teal-900">AI Pattern Analysis</p>
            </div>

            <div className="rounded-2xl bg-white border border-teal-100 px-4 py-3 text-sm text-slate-700 italic">
              {result.summary}
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                Detected Patterns
              </p>
              <ul className="space-y-1">
                {result.patterns.map((pattern) => (
                  <li key={pattern} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1 h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                    {pattern}
                  </li>
                ))}
              </ul>
            </div>

            {result.risk_flags.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                  Risk Flags
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.risk_flags.map((flag) => (
                    <Badge
                      key={flag.flag}
                      variant={flag.color === "red" ? "secondary" : "warning"}
                      className={
                        flag.color === "red"
                          ? "bg-red-100 text-red-800 border-red-200"
                          : "bg-yellow-100 text-yellow-800 border-yellow-200"
                      }
                    >
                      {flag.flag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                Recommendations
              </p>
              <ul className="space-y-1">
                {result.recommendations.map((rec) => (
                  <li key={rec} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1 h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
