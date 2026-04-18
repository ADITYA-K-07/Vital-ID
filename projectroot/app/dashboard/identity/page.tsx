import { getDashboardData } from "@/lib/dashboard-data";
import { PatientMedicalID } from "@/components/dashboard/patient-medical-id";

export default async function MedicalIdentityPage() {
  const data = await getDashboardData();
  return <PatientMedicalID data={data} />;
}