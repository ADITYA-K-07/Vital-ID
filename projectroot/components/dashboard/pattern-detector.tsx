"use client";

import { Activity, LoaderCircle, Sparkles } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MedicalRecord, ProfileSummary } from "@/types";

interface RiskFlag {
  flag: string;
  color: "yellow" | "red";
}

interface PatternResult {
  patterns: string[];
  risk_flags: RiskFlag[];
  recommendations: string[];
  summary: string;
}

interface PatternDetectorProps {
  records: MedicalRecord[];
  profile: ProfileSummary;
}

export function PatternDetector({ records, profile }: PatternDetectorProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PatternResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDetect = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    // Format records for the API
    const formattedRecords = records.map((r) => ({
      date: r.recordedAt,
      condition: r.conditions.join(", ") || "General checkup",
      notes: `BP: ${r.bloodPressure}, HR: ${r.heartRate}bpm, O2: ${r.oxygenSaturation}%, Meds: ${r.medications.join(", ")}`
    }));

    try {
      const response = await fetch("http://localhost:8000/api/patterns/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: profile.fullName,
          records: formattedRecords
        })
      });

      const data = await response.json();
      const raw = data.patterns as string;
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed: PatternResult = JSON.parse(cleaned);
      setResult(parsed);
    } catch {
      setError("Failed to detect patterns. Make sure the backend is running.");
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
        {/* Records preview */}
        <div className="rounded-2xl border border-border/70 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
          Analyzing <span className="font-semibold text-slate-900">{records.length} health records</span> for <span className="font-semibold text-slate-900">{profile.fullName}</span>
        </div>

        <Button
          type="button"
          className="w-full bg-teal-700 hover:bg-teal-800"
          onClick={handleDetect}
          disabled={loading}
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

            {/* Summary */}
            <div className="rounded-2xl bg-white border border-teal-100 px-4 py-3 text-sm text-slate-700 italic">
              {result.summary}
            </div>

            {/* Patterns */}
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

            {/* Risk Flags */}
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
                      {flag.color === "red" ? "🔴" : "🟡"} {flag.flag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
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