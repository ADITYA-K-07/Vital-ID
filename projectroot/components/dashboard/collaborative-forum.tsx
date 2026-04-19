"use client";

import {
  Globe,
  Plus,
  Upload,
  MessageSquare,
  Clock,
  ChevronUp,
  Stethoscope,
  X,
  UserCheck,
  FileSearch,
  Loader2,
  CheckCircle2,
  Mail
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/utils";
import type { DiagnosisEntry } from "@/types";

// Mock global cases from other doctors
const globalCases: DiagnosisEntry[] = [
  {
    id: "g-01",
    caseId: "CASE-3891",
    authorName: "Dr. Rahul Verma",
    specialty: "Neurology",
    note: "Patient 38F presenting with recurring focal seizures unresponsive to standard AEDs. MRI shows subtle cortical dysplasia. Seeking input on surgical candidacy criteria and pre-surgical workup recommendations.",
    status: "Needs Review",
    createdAt: "2026-04-18T09:00:00.000Z",
    confidenceScore: 0
  },
  {
    id: "g-02",
    caseId: "CASE-3754",
    authorName: "Dr. Amelia Fernandez",
    specialty: "Rheumatology",
    note: "Male 52, ANA positive, joint inflammation, skin rash, elevated CRP. DMARD therapy started but minimal response after 3 months. Overlap syndrome suspected. Seeking differential diagnosis support.",
    status: "Shared",
    createdAt: "2026-04-17T14:30:00.000Z",
    confidenceScore: 0
  },
  {
    id: "g-03",
    caseId: "CASE-3612",
    authorName: "Dr. James Okafor",
    specialty: "Hepatology",
    note: "Child 9M with unexplained hepatomegaly and elevated liver enzymes. Wilson's disease and metabolic disorders ruled out. Liver biopsy pending. Any experience with similar pediatric presentations?",
    status: "Needs Review",
    createdAt: "2026-04-16T11:00:00.000Z",
    confidenceScore: 0
  }
];

interface MatchedDoctor {
  name: string;
  specialty: string;
  hospital: string;
  country: string;
  reason: string;
}

interface SimilarCase {
  case_id: string;
  title: string;
  specialty: string;
  description: string;
  resolution: string;
}

interface MatchResult {
  matched_doctors: MatchedDoctor[];
  similar_cases: SimilarCase[];
}

interface ReplyState {
  [caseId: string]: string;
}

interface CollaborativeForumProps {
  initialCases: DiagnosisEntry[];
}

export function CollaborativeForum({ initialCases }: CollaborativeForumProps) {
  const [showPostForm, setShowPostForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"global" | "my">("global");
  const [replies, setReplies] = useState<ReplyState>({});
  const [openReply, setOpenReply] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [invitedDoctors, setInvitedDoctors] = useState<Set<string>>(new Set());

  // Post form state
  const [caseTitle, setCaseTitle] = useState("");
  const [caseSpecialty, setCaseSpecialty] = useState("");
  const [caseDescription, setCaseDescription] = useState("");
  const [myCases, setMyCases] = useState<DiagnosisEntry[]>(Array.isArray(initialCases) ? initialCases : []);

  // AI match state
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [postedCaseId, setPostedCaseId] = useState<string | null>(null);

  const handlePostCase = async () => {
    if (!caseTitle.trim() || !caseDescription.trim()) return;

    // Add to my cases
    const newCase: DiagnosisEntry = {
      id: `my-${Date.now()}`,
      caseId: `CASE-${Math.floor(Math.random() * 9000 + 1000)}`,
      authorName: "You",
      specialty: caseSpecialty || "General Medicine",
      note: `${caseTitle}\n\n${caseDescription}`,
      status: "Shared",
      createdAt: new Date().toISOString(),
      confidenceScore: 0
    };
    setMyCases((prev) => [newCase, ...(Array.isArray(prev) ? prev : [])]);
    setPostedCaseId(newCase.id);
    setShowPostForm(false);
    setActiveTab("my");

    // Trigger Groq AI matching
    setMatchLoading(true);
    setMatchResult(null);
    setMatchError(null);

    try {
      const response = await fetch("http://localhost:8000/api/cases/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: caseTitle,
          specialty: caseSpecialty || "General Medicine",
          description: caseDescription
        })
      });
      const data: MatchResult = await response.json();
      setMatchResult(data);
    } catch {
      setMatchError("Could not connect to AI backend. Make sure the server is running.");
    } finally {
      setMatchLoading(false);
    }

    setCaseTitle("");
    setCaseSpecialty("");
    setCaseDescription("");
  };

  const handleInvite = (doctorName: string) => {
    setInvitedDoctors((prev) => new Set(prev).add(doctorName));
  };

  const handleReply = (caseId: string) => {
    if (!replies[caseId]?.trim()) return;
    setSavedStatus("Your solution has been shared with the case author.");
    setReplies((prev) => ({ ...prev, [caseId]: "" }));
    setOpenReply(null);
    setTimeout(() => setSavedStatus(null), 4000);
  };

  const statusVariant = (status: string) => {
    if (status === "Resolved") return "success";
    if (status === "Needs Review") return "warning";
    return "secondary";
  };

  const CaseCard = ({ c, showReply }: { c: DiagnosisEntry; showReply: boolean }) => (
    <Card className={postedCaseId === c.id ? "border-teal-300 ring-1 ring-teal-200" : ""}>
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-2 py-0.5">
                {c.caseId}
              </span>
              <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {formatDateTime(c.createdAt)}
              </span>
            </div>
            <p className="flex items-center gap-1.5 text-sm text-slate-600">
              <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium">{c.authorName}</span>
              <span className="text-slate-400">·</span>
              <span>{c.specialty}</span>
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-700 leading-7">{c.note}</p>

        {showReply && (
          <div>
            {openReply === c.id ? (
              <div className="space-y-3 border-t border-border/50 pt-4">
                <Label>Your solution or suggestion</Label>
                <Textarea
                  placeholder="Share your clinical insight, diagnosis suggestion, or recommended next steps..."
                  rows={3}
                  value={replies[c.id] ?? ""}
                  onChange={(e) => setReplies((prev) => ({ ...prev, [c.id]: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleReply(c.id)} className="gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Share Solution
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setOpenReply(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="gap-1.5 mt-1" onClick={() => setOpenReply(c.id)}>
                <MessageSquare className="h-3.5 w-3.5" /> Respond to this case
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      {savedStatus && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">
          {savedStatus}
        </div>
      )}

      {/* Tabs + Post button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "global" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("global")}
            className="gap-1.5"
          >
            <Globe className="h-3.5 w-3.5" /> Global Cases
          </Button>
          <Button
            variant={activeTab === "my" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("my")}
            className="gap-1.5"
          >
            <Stethoscope className="h-3.5 w-3.5" /> My Posted Cases
          </Button>
        </div>
        <Button onClick={() => setShowPostForm(!showPostForm)} className="gap-1.5" size="sm">
          {showPostForm ? <ChevronUp className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          Post a Case
        </Button>
      </div>

      {/* Post form */}
      {showPostForm && (
        <Card className="border-teal-200 bg-teal-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Post a Difficult Case</CardTitle>
            <CardDescription>
              Describe the case — Groq AI will instantly match relevant specialists and similar resolved cases.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Case title / chief complaint</Label>
                <Input
                  placeholder="e.g. Unexplained hepatomegaly in 9yr old"
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Specialty</Label>
                <Input
                  placeholder="e.g. Hepatology, Neurology..."
                  value={caseSpecialty}
                  onChange={(e) => setCaseSpecialty(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Case description</Label>
              <Textarea
                placeholder="Describe the patient (anonymized), symptoms, investigations done, treatments tried, and what you're struggling to determine..."
                rows={5}
                value={caseDescription}
                onChange={(e) => setCaseDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-1.5" size="sm">
                <Upload className="h-3.5 w-3.5" /> Attach Scans / Reports
              </Button>
              <Button onClick={handlePostCase} className="gap-1.5" disabled={!caseTitle.trim() || !caseDescription.trim()}>
                <Globe className="h-3.5 w-3.5" /> Post & Find Matches
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Match Results — shown after posting */}
      {(matchLoading || matchResult || matchError) && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">AI Match Results</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {matchLoading && (
            <Card className="border-dashed border-teal-300">
              <CardContent className="flex items-center justify-center gap-3 py-10 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                <p className="text-sm">Groq AI is analyzing your case and finding matches...</p>
              </CardContent>
            </Card>
          )}

          {matchError && (
            <Card className="border-rose-200 bg-rose-50">
              <CardContent className="pt-5 text-sm text-rose-700">{matchError}</CardContent>
            </Card>
          )}

          {matchResult && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Matched Doctors */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-teal-50 p-2 text-teal-700">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Relevant Specialists</CardTitle>
                      <CardDescription>Doctors matched by Groq AI based on your case</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {matchResult.matched_doctors.map((doc, i) => (
                    <div key={i} className="rounded-2xl border border-border/60 bg-slate-50 p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{doc.name}</p>
                          <p className="text-xs text-slate-500">{doc.specialty} · {doc.hospital}</p>
                          <p className="text-xs text-slate-400">{doc.country}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={invitedDoctors.has(doc.name) ? "secondary" : "outline"}
                          className="shrink-0 gap-1.5 text-xs"
                          onClick={() => handleInvite(doc.name)}
                          disabled={invitedDoctors.has(doc.name)}
                        >
                          {invitedDoctors.has(doc.name) ? (
                            <><CheckCircle2 className="h-3 w-3" /> Invited</>
                          ) : (
                            <><Mail className="h-3 w-3" /> Invite to Case</>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-3 py-1.5 leading-5">
                        {doc.reason}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Similar Cases with Resolutions */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-violet-50 p-2 text-violet-700">
                      <FileSearch className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Similar Past Cases</CardTitle>
                      <CardDescription>Resolved cases matched by Groq AI — with outcomes</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {matchResult.similar_cases.map((sc, i) => (
                    <div key={i} className="rounded-2xl border border-border/60 bg-slate-50 p-4 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-2 py-0.5">
                          {sc.case_id}
                        </span>
                        <Badge variant="secondary">{sc.specialty}</Badge>
                      </div>
                      <p className="font-medium text-sm text-slate-900">{sc.title}</p>
                      <p className="text-xs text-slate-500 leading-5">{sc.description}</p>
                      <div className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-600 mb-1">Resolution</p>
                        <p className="text-xs text-teal-800 leading-5">{sc.resolution}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Cases list */}
      <div className="space-y-4">
        {activeTab === "global" ? (
          <>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
              {globalCases.length} open cases from doctors worldwide
            </p>
            {globalCases.map((c) => <CaseCard key={c.id} c={c} showReply={true} />)}
          </>
        ) : (
          <>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
              {myCases.length} cases you've posted
            </p>
            {myCases.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-slate-400">
                  <Globe className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">You haven't posted any cases yet.</p>
                  <p className="text-xs mt-1">Use "Post a Case" to get help from the global community.</p>
                </CardContent>
              </Card>
            ) : (
              myCases.map((c) => <CaseCard key={c.id} c={c} showReply={false} />)
            )}
          </>
        )}
      </div>
    </>
  );
}