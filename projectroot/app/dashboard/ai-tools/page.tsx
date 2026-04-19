import { getDashboardData } from "@/lib/dashboard-data";
import { redirect } from "next/navigation";
import { DoctorAiTools } from "@/components/dashboard/doctor-ai-tools";

export default async function AIToolsPage() {
  const data = await getDashboardData();
  if (data.viewer.role !== "doctor") redirect("/dashboard");

  return (
    <>
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/60 bg-white/70 p-6 backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-700">AI Tools</p>
        <h1 className="font-serif text-3xl text-slate-900 lg:text-4xl">AI-Powered Clinical Analysis</h1>
        <p className="text-sm leading-7 text-slate-500 max-w-2xl">
          Use AI to analyze clinical notes and detect patterns in patient health records using Groq AI.
        </p>
      </div>

      <DoctorAiTools />
    </>
  );
}
