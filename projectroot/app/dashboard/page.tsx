import { getDashboardData } from "@/lib/dashboard-data";
import { PatientDashboard } from "@/components/dashboard/patient-dashboard";
import { DoctorDashboard } from "@/components/dashboard/doctor-dashboard";

export default async function DashboardPage() {
  const data = await getDashboardData();
  
  if (data.viewer.role === "doctor") {
    return <DoctorDashboard />;
  }

  return <PatientDashboard data={data} />;
}