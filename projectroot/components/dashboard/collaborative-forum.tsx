"use client";

import {
  CheckCircle2,
  ChevronUp,
  Clock,
  FileSearch,
  Globe,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  Stethoscope,
  Upload,
  UserCheck
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type ApiForumCaseItem,
  type ApiForumCaseMatchResponse,
  type ApiForumCommentItem,
  type ApiForumCommentsResponse,
  fetchFastApiJson,
  getBrowserAccessToken,
  mapApiForumCase,
  mapApiForumComment
} from "@/lib/fastapi";
import { DEMO_SESSION_TOKEN } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";
import type { ForumCase, ForumComment } from "@/types";

interface CollaborativeForumProps {
  initialCases: ForumCase[];
  viewerProfileId: string;
}

interface ReplyState {
  [caseId: string]: string;
}

function buildCaseDisplayId(caseId: string) {
  return `CASE-${caseId.slice(0, 8).toUpperCase()}`;
}

function buildDemoMatchResult(
  title: string,
  specialty: string,
  description: string
): ApiForumCaseMatchResponse {
  return {
    matched_doctors: [
      {
        name: "Dr. Asha Menon",
        specialty: specialty || "General Medicine",
        hospital: "Apollo Clinical Centre",
        country: "India",
        reason: `Relevant for ${title} based on the posted case summary.`
      },
      {
        name: "Dr. Daniel Brooks",
        specialty: specialty || "Internal Medicine",
        hospital: "St. Mary's Teaching Hospital",
        country: "United Kingdom",
        reason: "Experienced with unresolved multidisciplinary case reviews."
      },
      {
        name: "Dr. Sofia Alvarez",
        specialty: specialty || "Diagnostic Medicine",
        hospital: "University Hospital Madrid",
        country: "Spain",
        reason: description
          ? "Strong fit for unusual or prolonged diagnostic workups."
          : "Useful second opinion for the discussion."
      }
    ],
    similar_cases: [
      {
        case_id: "CASE-4812",
        title: "Escalated tertiary review case",
        specialty: specialty || "General Medicine",
        description: "A prior clinician sought wider specialist input after first-line treatment underperformed.",
        resolution: "Follow-up testing and multidisciplinary review narrowed the diagnosis and changed treatment."
      },
      {
        case_id: "CASE-4387",
        title: "Atypical presentation with delayed clarity",
        specialty: specialty || "General Medicine",
        description: "Symptoms appeared broad until history, labs, and imaging were reviewed together.",
        resolution: "A focused workup narrowed the differential and improved the care plan."
      },
      {
        case_id: "CASE-4021",
        title: "Rare-pattern diagnostic discussion",
        specialty: specialty || "General Medicine",
        description: "Several common explanations were ruled out before the final diagnosis emerged.",
        resolution: "Specialist escalation led to confirmation and more specific management."
      }
    ]
  };
}

function createLocalCase(title: string, specialty: string, description: string): ForumCase {
  return {
    id: `local-${Date.now()}`,
    doctorId: "demo-doctor",
    authorName: "You",
    title,
    description,
    specialty: specialty || "General Medicine",
    status: "Shared",
    createdAt: new Date().toISOString()
  };
}

export function CollaborativeForum({ initialCases, viewerProfileId }: CollaborativeForumProps) {
  const [showPostForm, setShowPostForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"global" | "my">("global");
  const [replies, setReplies] = useState<ReplyState>({});
  const [openThread, setOpenThread] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [invitedDoctors, setInvitedDoctors] = useState<Set<string>>(new Set());
  const [commentsByCase, setCommentsByCase] = useState<Record<string, ForumComment[]>>({});
  const [commentLoadingByCase, setCommentLoadingByCase] = useState<Record<string, boolean>>({});

  const [caseTitle, setCaseTitle] = useState("");
  const [caseSpecialty, setCaseSpecialty] = useState("");
  const [caseDescription, setCaseDescription] = useState("");
  const [cases, setCases] = useState<ForumCase[]>(Array.isArray(initialCases) ? initialCases : []);

  const [matchLoading, setMatchLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<ApiForumCaseMatchResponse | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [postedCaseId, setPostedCaseId] = useState<string | null>(null);

  const myCases = cases.filter((item) => item.doctorId === viewerProfileId || item.authorName === "You");
  const globalCases = cases.filter((item) => item.doctorId !== viewerProfileId && item.authorName !== "You");

  const loadComments = async (caseId: string) => {
    if (commentsByCase[caseId] || commentLoadingByCase[caseId]) return;

    const accessToken = getBrowserAccessToken();
    if (!accessToken || accessToken === DEMO_SESSION_TOKEN) {
      setCommentsByCase((prev) => ({ ...prev, [caseId]: [] }));
      return;
    }

    setCommentLoadingByCase((prev) => ({ ...prev, [caseId]: true }));
    try {
      const data = await fetchFastApiJson<ApiForumCommentsResponse>(
        `/api/forum/cases/${encodeURIComponent(caseId)}/comments`,
        { accessToken }
      );
      setCommentsByCase((prev) => ({
        ...prev,
        [caseId]: data.comments.map(mapApiForumComment)
      }));
    } catch {
      setCommentsByCase((prev) => ({ ...prev, [caseId]: [] }));
    } finally {
      setCommentLoadingByCase((prev) => ({ ...prev, [caseId]: false }));
    }
  };

  const toggleThread = async (caseId: string) => {
    if (openThread === caseId) {
      setOpenThread(null);
      return;
    }

    setOpenThread(caseId);
    await loadComments(caseId);
  };

  const handlePostCase = async () => {
    if (!caseTitle.trim() || !caseDescription.trim()) return;

    setMatchLoading(true);
    setMatchResult(null);
    setMatchError(null);

    try {
      const accessToken = getBrowserAccessToken();
      const payload = {
        title: caseTitle.trim(),
        specialty: caseSpecialty.trim() || "General Medicine",
        description: caseDescription.trim()
      };

      let createdCase: ForumCase;
      let matched: ApiForumCaseMatchResponse;

      if (!accessToken || accessToken === DEMO_SESSION_TOKEN) {
        createdCase = createLocalCase(payload.title, payload.specialty, payload.description);
        matched = buildDemoMatchResult(payload.title, payload.specialty, payload.description);
      } else {
        const created = await fetchFastApiJson<ApiForumCaseItem>("/api/forum/cases", {
          method: "POST",
          accessToken,
          body: JSON.stringify(payload)
        });
        const match = await fetchFastApiJson<ApiForumCaseMatchResponse>("/api/forum/cases/match", {
          method: "POST",
          accessToken,
          body: JSON.stringify(payload)
        });
        createdCase = mapApiForumCase(created);
        matched = match;
      }

      setCases((prev) => [createdCase, ...prev]);
      setCommentsByCase((prev) => ({ ...prev, [createdCase.id]: [] }));
      setPostedCaseId(createdCase.id);
      setShowPostForm(false);
      setActiveTab("my");
      setOpenThread(createdCase.id);
      setMatchResult(matched);
      setCaseTitle("");
      setCaseSpecialty("");
      setCaseDescription("");
    } catch (error) {
      setMatchError(
        error instanceof Error ? error.message : "Could not connect to the forum backend."
      );
    } finally {
      setMatchLoading(false);
    }
  };

  const handleInvite = (doctorName: string) => {
    setInvitedDoctors((prev) => new Set(prev).add(doctorName));
  };

  const handleReply = async (caseId: string) => {
    if (!replies[caseId]?.trim()) return;

    try {
      const accessToken = getBrowserAccessToken();
      const message = replies[caseId].trim();
      let createdComment: ForumComment;

      if (!accessToken || accessToken === DEMO_SESSION_TOKEN) {
        createdComment = {
          id: `local-comment-${Date.now()}`,
          caseId,
          doctorId: viewerProfileId,
          authorName: "You",
          comment: message,
          createdAt: new Date().toISOString()
        };
      } else {
        const created = await fetchFastApiJson<ApiForumCommentItem>(
          `/api/forum/cases/${encodeURIComponent(caseId)}/comments`,
          {
            method: "POST",
            accessToken,
            body: JSON.stringify({ comment: message })
          }
        );
        createdComment = mapApiForumComment(created);
      }

      setCommentsByCase((prev) => ({
        ...prev,
        [caseId]: [...(prev[caseId] ?? []), createdComment]
      }));
      setReplies((prev) => ({ ...prev, [caseId]: "" }));
      setSavedStatus("Your solution has been shared with the case author.");
      setTimeout(() => setSavedStatus(null), 4000);
    } catch (error) {
      setSavedStatus(error instanceof Error ? error.message : "Unable to post your reply.");
      setTimeout(() => setSavedStatus(null), 4000);
    }
  };

  const statusVariant = (status: string) => {
    if (status === "Resolved") return "success";
    if (status === "Needs Review") return "warning";
    return "secondary";
  };

  const CaseCard = ({ c, showReply }: { c: ForumCase; showReply: boolean }) => (
    <Card className={postedCaseId === c.id ? "border-teal-300 ring-1 ring-teal-200" : ""}>
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-2 py-0.5">
                {buildCaseDisplayId(c.id)}
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
            <p className="text-base font-semibold text-slate-900">{c.title}</p>
          </div>
        </div>

        <p className="text-sm text-slate-700 leading-7">{c.description}</p>

        <div className="border-t border-border/50 pt-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Button size="sm" variant="outline" className="gap-1.5 mt-1" onClick={() => void toggleThread(c.id)}>
              <MessageSquare className="h-3.5 w-3.5" />
              {openThread === c.id ? "Hide discussion" : "View discussion"}
            </Button>
            <span className="text-xs text-slate-400">
              {(commentsByCase[c.id] ?? []).length} repl{(commentsByCase[c.id] ?? []).length === 1 ? "y" : "ies"}
            </span>
          </div>

          {openThread === c.id ? (
            <div className="space-y-3">
              {commentLoadingByCase[c.id] ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                  Loading replies...
                </div>
              ) : (commentsByCase[c.id] ?? []).length > 0 ? (
                (commentsByCase[c.id] ?? []).map((comment) => (
                  <div key={comment.id} className="rounded-2xl border border-border/60 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-900">{comment.authorName}</p>
                      <span className="text-xs text-slate-400">{formatDateTime(comment.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{comment.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No replies yet.</p>
              )}

              {showReply ? (
                <>
                  <Label>Your solution or suggestion</Label>
                  <Textarea
                    placeholder="Share your clinical insight, diagnosis suggestion, or recommended next steps..."
                    rows={3}
                    value={replies[c.id] ?? ""}
                    onChange={(e) => setReplies((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void handleReply(c.id)} className="gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" /> Share Solution
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {savedStatus ? (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">
          {savedStatus}
        </div>
      ) : null}

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

      {showPostForm ? (
        <Card className="border-teal-200 bg-teal-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Post a Difficult Case</CardTitle>
            <CardDescription>
              Describe the case — the main FastAPI backend will match relevant specialists and similar resolved cases.
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
      ) : null}

      {matchLoading || matchResult || matchError ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">AI Match Results</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {matchLoading ? (
            <Card className="border-dashed border-teal-300">
              <CardContent className="flex items-center justify-center gap-3 py-10 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                <p className="text-sm">The backend AI matcher is analyzing your case and finding matches...</p>
              </CardContent>
            </Card>
          ) : null}

          {matchError ? (
            <Card className="border-rose-200 bg-rose-50">
              <CardContent className="pt-5 text-sm text-rose-700">{matchError}</CardContent>
            </Card>
          ) : null}

          {matchResult ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-teal-50 p-2 text-teal-700">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Relevant Specialists</CardTitle>
                      <CardDescription>Doctors matched by AI based on your case</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {matchResult.matched_doctors.map((doc) => (
                    <div key={`${doc.name}-${doc.hospital}`} className="rounded-2xl border border-border/60 bg-slate-50 p-4 space-y-2">
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

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-violet-50 p-2 text-violet-700">
                      <FileSearch className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Similar Past Cases</CardTitle>
                      <CardDescription>Resolved cases matched by AI, with outcomes</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {matchResult.similar_cases.map((sc) => (
                    <div key={sc.case_id} className="rounded-2xl border border-border/60 bg-slate-50 p-4 space-y-2">
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
          ) : null}
        </div>
      ) : null}

      <div className="space-y-4">
        {activeTab === "global" ? (
          <>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
              {globalCases.length} open cases from doctors worldwide
            </p>
            {globalCases.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-slate-400">
                  <Globe className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No global cases have been posted yet.</p>
                </CardContent>
              </Card>
            ) : (
              globalCases.map((c) => <CaseCard key={c.id} c={c} showReply={true} />)
            )}
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
