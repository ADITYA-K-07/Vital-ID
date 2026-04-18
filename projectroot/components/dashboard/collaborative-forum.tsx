"use client";

import {
  Globe,
  Plus,
  Upload,
  MessageSquare,
  Clock,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  X
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

  // New case form state
  const [caseTitle, setCaseTitle] = useState("");
  const [caseSpecialty, setCaseSpecialty] = useState("");
  const [caseDescription, setCaseDescription] = useState("");
  const [myCases, setMyCases] = useState<DiagnosisEntry[]>(initialCases);

  const handlePostCase = async () => {
    if (!caseTitle.trim() || !caseDescription.trim()) return;
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
    setMyCases((prev) => [newCase, ...prev]);
    setCaseTitle("");
    setCaseSpecialty("");
    setCaseDescription("");
    setShowPostForm(false);
    setSavedStatus("Case posted successfully to the global forum.");
    setTimeout(() => setSavedStatus(null), 4000);
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
    <Card key={c.id}>
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-2 py-0.5">{c.caseId}</span>
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
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 mt-1"
                onClick={() => setOpenReply(c.id)}
              >
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
        <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">{savedStatus}</div>
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
            <CardDescription>Share anonymized patient info, scans, and describe the clinical challenge. Doctors worldwide can respond.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Case title / chief complaint</Label>
                <Input placeholder="e.g. Unexplained hepatomegaly in 9yr old" value={caseTitle} onChange={(e) => setCaseTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Specialty</Label>
                <Input placeholder="e.g. Hepatology, Neurology..." value={caseSpecialty} onChange={(e) => setCaseSpecialty(e.target.value)} />
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
              <Button onClick={handlePostCase} className="gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Post to Global Forum
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cases list */}
      <div className="space-y-4">
        {activeTab === "global" ? (
          <>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{globalCases.length} open cases from doctors worldwide</p>
            {globalCases.map((c) => <CaseCard key={c.id} c={c} showReply={true} />)}
          </>
        ) : (
          <>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{myCases.length} cases you've posted</p>
            {myCases.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-slate-400">
                  <Globe className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">You haven't posted any cases yet.</p>
                  <p className="text-xs mt-1">Use the "Post a Case" button to get help from the global community.</p>
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