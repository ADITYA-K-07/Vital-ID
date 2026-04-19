"use client";

import {
  Globe,
  Plus,
  MessageSquare,
  Clock,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  X,
  LoaderCircle
} from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type ApiForumCaseItem,
  type ApiForumCommentItem,
  type ApiMeResponse,
  buildCaseDisplayId,
  fetchFastApiJson,
  getBrowserAccessToken
} from "@/lib/fastapi";
import { formatDateTime } from "@/lib/utils";
import { DEMO_SESSION_TOKEN } from "@/lib/supabase/client";

interface ReplyState {
  [caseId: string]: string;
}

const demoCases: ApiForumCaseItem[] = [
  {
    id: "g-01",
    doctor_id: "demo-doctor",
    author_name: "Dr. Rahul Verma",
    title: "Recurring focal seizures",
    specialty: "Neurology",
    description:
      "Patient 38F presenting with recurring focal seizures unresponsive to standard AEDs. MRI shows subtle cortical dysplasia. Seeking input on surgical candidacy criteria and pre-surgical workup recommendations.",
    status: "Needs Review",
    created_at: "2026-04-18T09:00:00.000Z"
  },
  {
    id: "g-02",
    doctor_id: "demo-peer",
    author_name: "Dr. Amelia Fernandez",
    title: "Inflammatory overlap concern",
    specialty: "Rheumatology",
    description:
      "Male 52, ANA positive, joint inflammation, skin rash, elevated CRP. DMARD therapy started but minimal response after 3 months. Overlap syndrome suspected. Seeking differential diagnosis support.",
    status: "Shared",
    created_at: "2026-04-17T14:30:00.000Z"
  }
];

export function CollaborativeForum() {
  const [showPostForm, setShowPostForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"global" | "my">("global");
  const [replies, setReplies] = useState<ReplyState>({});
  const [openReply, setOpenReply] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [cases, setCases] = useState<ApiForumCaseItem[]>([]);
  const [commentsByCase, setCommentsByCase] = useState<Record<string, ApiForumCommentItem[]>>({});
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingCommentsFor, setLoadingCommentsFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [caseTitle, setCaseTitle] = useState("");
  const [caseSpecialty, setCaseSpecialty] = useState("");
  const [caseDescription, setCaseDescription] = useState("");

  useEffect(() => {
    void loadForum();
  }, []);

  async function loadForum() {
    setLoadingCases(true);
    setError(null);
    try {
      const accessToken = getBrowserAccessToken();
      if (!accessToken || accessToken === DEMO_SESSION_TOKEN) {
        setCases(demoCases);
        setCurrentDoctorId("demo-doctor");
        return;
      }

      const [me, casesResponse] = await Promise.all([
        fetchFastApiJson<ApiMeResponse>("/api/me", { accessToken }),
        fetchFastApiJson<{ cases: ApiForumCaseItem[] }>("/api/forum/cases", { accessToken })
      ]);

      setCurrentDoctorId(me.profile_id);
      setCases(casesResponse.cases);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to load forum cases."
      );
    } finally {
      setLoadingCases(false);
    }
  }

  async function loadComments(caseId: string) {
    if (commentsByCase[caseId]) return;

    setLoadingCommentsFor(caseId);
    try {
      const accessToken = getBrowserAccessToken();
      if (!accessToken || accessToken === DEMO_SESSION_TOKEN) {
        setCommentsByCase((current) => ({
          ...current,
          [caseId]: []
        }));
        return;
      }

      const response = await fetchFastApiJson<{ comments: ApiForumCommentItem[] }>(
        `/api/forum/cases/${encodeURIComponent(caseId)}/comments`,
        { accessToken }
      );
      setCommentsByCase((current) => ({
        ...current,
        [caseId]: response.comments
      }));
    } catch (caughtError) {
      setSavedStatus(
        caughtError instanceof Error ? caughtError.message : "Unable to load comments."
      );
    } finally {
      setLoadingCommentsFor(null);
    }
  }

  const handlePostCase = async () => {
    if (!caseTitle.trim() || !caseDescription.trim()) return;

    try {
      const accessToken = getBrowserAccessToken();
      if (!accessToken || accessToken === DEMO_SESSION_TOKEN) {
        const demoCase: ApiForumCaseItem = {
          id: `demo-${Date.now()}`,
          doctor_id: currentDoctorId ?? "demo-doctor",
          author_name: "You",
          title: caseTitle,
          specialty: caseSpecialty || "General Medicine",
          description: caseDescription,
          status: "Shared",
          created_at: new Date().toISOString()
        };
        setCases((current) => [demoCase, ...current]);
      } else {
        const created = await fetchFastApiJson<ApiForumCaseItem>("/api/forum/cases", {
          method: "POST",
          accessToken,
          body: JSON.stringify({
            title: caseTitle,
            specialty: caseSpecialty || "General Medicine",
            description: caseDescription,
            status: "Shared"
          })
        });
        setCases((current) => [created, ...current]);
      }

      setCaseTitle("");
      setCaseSpecialty("");
      setCaseDescription("");
      setShowPostForm(false);
      setSavedStatus("Case posted successfully to the global forum.");
      setTimeout(() => setSavedStatus(null), 4000);
    } catch (caughtError) {
      setSavedStatus(
        caughtError instanceof Error ? caughtError.message : "Unable to post case."
      );
    }
  };

  const handleReply = async (caseId: string) => {
    const reply = replies[caseId];
    if (!reply?.trim()) return;

    try {
      const accessToken = getBrowserAccessToken();
      if (!accessToken || accessToken === DEMO_SESSION_TOKEN) {
        const newComment: ApiForumCommentItem = {
          id: `demo-comment-${Date.now()}`,
          case_id: caseId,
          doctor_id: currentDoctorId ?? "demo-doctor",
          author_name: "You",
          comment: reply,
          created_at: new Date().toISOString()
        };
        setCommentsByCase((current) => ({
          ...current,
          [caseId]: [...(current[caseId] ?? []), newComment]
        }));
      } else {
        const created = await fetchFastApiJson<ApiForumCommentItem>(
          `/api/forum/cases/${encodeURIComponent(caseId)}/comments`,
          {
            method: "POST",
            accessToken,
            body: JSON.stringify({ comment: reply })
          }
        );
        setCommentsByCase((current) => ({
          ...current,
          [caseId]: [...(current[caseId] ?? []), created]
        }));
      }

      setSavedStatus("Your solution has been shared with the case thread.");
      setReplies((current) => ({ ...current, [caseId]: "" }));
      setOpenReply(null);
      setTimeout(() => setSavedStatus(null), 4000);
    } catch (caughtError) {
      setSavedStatus(
        caughtError instanceof Error ? caughtError.message : "Unable to post comment."
      );
    }
  };

  const statusVariant = (status: string) => {
    if (status === "Resolved") return "success";
    if (status === "Needs Review") return "warning";
    return "secondary";
  };

  const visibleCases =
    activeTab === "global"
      ? cases
      : cases.filter((item) => item.doctor_id === currentDoctorId);

  const CaseCard = ({ c, showReply }: { c: ApiForumCaseItem; showReply: boolean }) => {
    const comments = commentsByCase[c.id] ?? [];

    return (
      <Card key={c.id}>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-2 py-0.5">
                  {buildCaseDisplayId(c.id)}
                </span>
                <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {c.created_at ? formatDateTime(c.created_at) : "Just now"}
                </span>
              </div>
              <p className="flex items-center gap-1.5 text-sm text-slate-600">
                <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium">{c.author_name}</span>
                <span className="text-slate-400">.</span>
                <span>{c.specialty ?? "General Medicine"}</span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-slate-900">{c.title}</p>
            <p className="text-sm text-slate-700 leading-7">{c.description}</p>
            {c.symptoms ? (
              <p className="text-xs text-slate-500 uppercase tracking-wide">Symptoms: {c.symptoms}</p>
            ) : null}
          </div>

          {comments.length > 0 && (
            <div className="space-y-2 border-t border-border/50 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Thread Replies
              </p>
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-2xl border border-border/60 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">{comment.author_name}</p>
                    <p className="text-xs text-slate-400">
                      {comment.created_at ? formatDateTime(comment.created_at) : "Just now"}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{comment.comment}</p>
                </div>
              ))}
            </div>
          )}

          {showReply && (
            <div>
              {openReply === c.id ? (
                <div className="space-y-3 border-t border-border/50 pt-4">
                  {loadingCommentsFor === c.id ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Loading replies...
                    </div>
                  ) : null}

                  <Label>Your solution or suggestion</Label>
                  <Textarea
                    placeholder="Share your clinical insight, diagnosis suggestion, or recommended next steps..."
                    rows={3}
                    value={replies[c.id] ?? ""}
                    onChange={(e) => setReplies((current) => ({ ...current, [c.id]: e.target.value }))}
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
                  onClick={() => {
                    setOpenReply(c.id);
                    void loadComments(c.id);
                  }}
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Respond to this case
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {savedStatus && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">{savedStatus}</div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

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

      {showPostForm && (
        <Card className="border-teal-200 bg-teal-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Post a Difficult Case</CardTitle>
            <CardDescription>Share anonymized patient context and describe the clinical challenge. Doctors worldwide can respond.</CardDescription>
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
              <Button onClick={handlePostCase} className="gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Post to Global Forum
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {loadingCases ? (
          <Card>
            <CardContent className="pt-6 flex items-center gap-2 text-sm text-slate-500">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading forum cases...
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
              {visibleCases.length} {activeTab === "global" ? "open cases from doctors worldwide" : "cases you've posted"}
            </p>
            {visibleCases.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-slate-400">
                  <Globe className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No cases available in this view yet.</p>
                </CardContent>
              </Card>
            ) : (
              visibleCases.map((c) => <CaseCard key={c.id} c={c} showReply={activeTab === "global"} />)
            )}
          </>
        )}
      </div>
    </>
  );
}
