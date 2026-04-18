import {
  Activity,
  CalendarClock,
  FileSpreadsheet,
  ShieldCheck
} from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { NotesAnalyzer } from "@/components/dashboard/notes-analyzer";
import { PatternDetector } from "@/components/dashboard/pattern-detector";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDashboardData } from "@/lib/dashboard-data";
import { formatDate, formatDateTime } from "@/lib/utils";

const statIcons = {
  reports: FileSpreadsheet,
  consultations: CalendarClock,
  cases: Activity,
  credentials: ShieldCheck
};

export default async function DashboardPage() {
  const data = await getDashboardData();
  const canViewSensitive = data.viewer.canViewSensitive;

  const stats = [
    {
      label: "Recent reports",
      value: data.medicalRecords.length,
      helper: "records synced",
      icon: statIcons.reports
    },
    {
      label: "Upcoming consultations",
      value: data.consultations.length,
      helper: "next 14 days",
      icon: statIcons.consultations
    },
    {
      label: "Open diagnosis threads",
      value: data.diagnoses.filter((entry) => entry.status !== "Resolved").length,
      helper: "active care discussions",
      icon: statIcons.cases
    },
    {
      label: "Verified credentials",
      value: data.credentials.filter((entry) => entry.status === "Verified").length,
      helper: "trusted network partners",
      icon: statIcons.credentials
    }
  ];

  return (
    <>
      <PageHeader
        eyebrow="Dashboard Overview"
        title={
          canViewSensitive
            ? "Clinical operations at a glance"
            : "Your privacy-aware medical dashboard"
        }
        description={
          canViewSensitive
            ? "A high-trust overview of recent reports, consultations, diagnosis activity, and credential status for the active medical profile."
            : "Review your records, consultations, and case progress while protected clinician-only details stay hidden."
        }
        demoMode={data.demoMode}
      />

      {/* Stats Section */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-4xl font-semibold text-slate-900">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-slate-500">{stat.helper}</p>
              </div>
              <div className="rounded-2xl bg-teal-50 p-3 text-teal-800">
                <stat.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* AI Features — Doctor Only */}
      {canViewSensitive && (
        <section className="grid gap-6 xl:grid-cols-2">
          <NotesAnalyzer />
          <PatternDetector
            records={data.medicalRecords}
            profile={data.profile}
          />
        </section>
      )}

      <Tabs defaultValue="operations">
        <TabsList>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="access">Access & trust</TabsTrigger>
        </TabsList>

        <TabsContent value="operations">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <CardHeader>
                <CardTitle>Recent health reports</CardTitle>
                <CardDescription>
                  Latest vitals and medical history snapshots from the patient
                  record.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Blood Pressure</TableHead>
                      <TableHead>Heart Rate</TableHead>
                      <TableHead>Oxygen</TableHead>
                      <TableHead>Conditions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.medicalRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{formatDate(record.recordedAt)}</TableCell>
                        <TableCell>{record.bloodPressure}</TableCell>
                        <TableCell>{record.heartRate} bpm</TableCell>
                        <TableCell>{record.oxygenSaturation}%</TableCell>
                        <TableCell>{record.conditions.join(", ")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming consultations</CardTitle>
                <CardDescription>
                  Confirmed specialist touchpoints and pending appointments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.consultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="rounded-3xl border border-border/70 bg-slate-50/70 p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {consultation.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {consultation.specialist}
                        </p>
                      </div>
                      <Badge
                        variant={
                          consultation.status === "Confirmed"
                            ? "success"
                            : consultation.status === "Pending"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {consultation.status}
                      </Badge>
                    </div>
                    <p className="mt-4 text-sm text-slate-600">
                      {formatDateTime(consultation.date)} / {consultation.mode}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="access">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>
                  {canViewSensitive ? "Case collaboration feed" : "Case status feed"}
                </CardTitle>
                <CardDescription>
                  {canViewSensitive
                    ? "Recent notes shared across active diagnosis cases."
                    : "Protected case updates with internal clinician commentary removed."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.diagnoses.slice(0, 4).map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-3xl border border-border/70 bg-slate-50/70 p-5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{entry.caseId}</p>
                        <p className="text-sm text-slate-500">
                          {canViewSensitive
                            ? `${entry.authorName} / ${entry.specialty}`
                            : "Clinician identity hidden"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          entry.status === "Resolved"
                            ? "success"
                            : entry.status === "Needs Review"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {entry.status}
                      </Badge>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {canViewSensitive
                        ? entry.note
                        : "Internal diagnosis notes are hidden in patient mode. The case status above remains visible."}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {canViewSensitive ? "Credential pulse" : "Provider trust pulse"}
                </CardTitle>
                <CardDescription>
                  {canViewSensitive
                    ? "Verification status of clinicians, labs, and coverage partners."
                    : "High-level trust coverage without exposing issuer or provider-sensitive details."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.credentials.map((credential) => (
                  <div
                    key={credential.id}
                    className="flex items-start justify-between gap-4 rounded-3xl border border-border/70 bg-slate-50/70 p-5"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {canViewSensitive ? credential.subject : "Verified provider"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {canViewSensitive
                          ? credential.issuer
                          : "Sensitive issuer details hidden"}
                      </p>
                      <p className="mt-3 text-sm text-slate-600">
                        {canViewSensitive
                          ? credential.type
                          : "Credential category protected"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        credential.status === "Verified"
                          ? "success"
                          : credential.status === "Pending Review"
                            ? "warning"
                            : "outline"
                      }
                    >
                      {credential.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}