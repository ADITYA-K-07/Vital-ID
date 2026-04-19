"use client";

import { BrainCircuit, LoaderCircle, Sparkles } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type ApiNotesAnalyzeResponse,
  type PatientLookupData,
  fetchFastApiJson,
  getBrowserAccessToken
} from "@/lib/fastapi";
import { DEMO_SESSION_TOKEN } from "@/lib/supabase/client";

interface NotesAnalyzerProps {
  selectedPatient: PatientLookupData | null;
}

function buildDemoAnalysis(notes: string, patientName?: string): ApiNotesAnalyzeResponse {
  const normalized = notes.toLowerCase();
  const symptoms = ["headache", "dizziness", "fatigue", "cough"].filter((item) =>
    normalized.includes(item)
  );
  const conditions = normalized.includes("bp") || normalized.includes("pressure")
    ? ["Blood pressure concern"]
    : ["General clinical review recommended"];

  return {
    symptoms: symptoms.length > 0 ? symptoms : ["No obvious symptom keywords detected"],
    possible_conditions: conditions,
    suggested_next_steps: [
      "Review the note alongside the latest vitals.",
      patientName
        ? `Reconcile the note against ${patientName}'s current chart.`
        : "Reconcile the note against the patient's current chart.",
      "Escalate if symptoms worsen or repeat."
    ],
    severity: normalized.includes("chest pain") || normalized.includes("shortness of breath")
      ? "high"
      : normalized.includes("bp") || normalized.includes("dizziness")
        ? "medium"
        : "low"
  };
}

export function NotesAnalyzer({ selectedPatient }: NotesAnalyzerProps) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiNotesAnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const severityColor = {
    low: "success",
    medium: "warning",
    high: "secondary"
  } as const;

  const handleAnalyze = async () => {
    if (!notes.trim() || !selectedPatient) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const accessToken = getBrowserAccessToken();
      if (!accessToken || accessToken === DEMO_SESSION_TOKEN) {
        setResult(buildDemoAnalysis(notes, selectedPatient.profile.fullName));
        return;
      }

      const data = await fetchFastApiJson<ApiNotesAnalyzeResponse>("/api/notes/analyze", {
        method: "POST",
        accessToken,
        body: JSON.stringify({
          notes,
          patient_id: selectedPatient.patientId,
          patient_name: selectedPatient.profile.fullName
        })
      });

      setResult(data);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to analyze notes. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-teal-700" />
          AI Notes Analyzer
        </CardTitle>
        <CardDescription>
          Enter clinical notes and let AI extract symptoms, conditions, and next steps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-border/70 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
          {selectedPatient ? (
            <>
              Analyzing notes for{" "}
              <span className="font-semibold text-slate-900">{selectedPatient.profile.fullName}</span>
            </>
          ) : (
            "Select a patient first to give the analysis clinical context."
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Clinical Notes</Label>
          <Textarea
            id="notes"
            placeholder="e.g. Patient reports recurring headaches, dizziness, BP 140/90..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px]"
            disabled={!selectedPatient}
          />
        </div>

        <Button
          type="button"
          className="w-full bg-teal-700 hover:bg-teal-800"
          onClick={handleAnalyze}
          disabled={loading || !notes.trim() || !selectedPatient}
        >
          {loading ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Analyzing notes...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze with AI
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
              <p className="font-semibold text-teal-900">AI Analysis</p>
              <Badge variant={severityColor[result.severity]}>
                {result.severity} severity
              </Badge>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                Symptoms Detected
              </p>
              <div className="flex flex-wrap gap-2">
                {result.symptoms.map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                Possible Conditions
              </p>
              <div className="flex flex-wrap gap-2">
                {result.possible_conditions.map((c) => (
                  <Badge key={c} variant="outline" className="border-teal-200 text-teal-800">{c}</Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                Suggested Next Steps
              </p>
              <ul className="space-y-1">
                {result.suggested_next_steps.map((step) => (
                  <li key={step} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1 h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                    {step}
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
