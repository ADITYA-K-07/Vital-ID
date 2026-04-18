import { getDashboardData } from "@/lib/dashboard-data";
import { redirect } from "next/navigation";
import { CollaborativeForum } from "@/components/dashboard/collaborative-forum";

export default async function DiagnosisPage() {
  const data = await getDashboardData();
  if (data.viewer.role !== "doctor") redirect("/dashboard");

  return (
    <>
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/60 bg-white/70 p-6 backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-700">Collaborative Diagnosis</p>
        <h1 className="font-serif text-3xl text-slate-900 lg:text-4xl">Global Case Forum</h1>
        <p className="text-sm leading-7 text-slate-500 max-w-2xl">
          Post difficult cases for the global doctor community to review. Browse open cases and share your expertise with fellow clinicians worldwide.
        </p>
      </div>
      <CollaborativeForum initialCases={data.diagnoses} />
    </>
  );
}