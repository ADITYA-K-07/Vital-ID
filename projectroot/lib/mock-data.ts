import type { DashboardData } from "@/types";

export const mockDashboardData: DashboardData = {
  demoMode: true,
  viewer: {
    role: "patient",
    canViewSensitive: false,
    licenseNumber: null,
    licenseVerified: false
  },
  profile: {
    id: "profile-demo-01",
    fullName: "Anika Sharma",
    role: "Patient",
    bloodType: "O+",
    emergencyContact: "+91 98765 44321",
    insuranceProvider: "Apollo Shield Gold",
    dob: "1992-08-14"
  },
  alerts: [
    {
      id: "alert-01",
      type: "warning",
      message: "Upcoming consultation with Dr. Neel Rao on 21 Apr — confirm attendance."
    },
    {
      id: "alert-02",
      type: "info",
      message: "Budesonide refill due in 5 days."
    }
  ],
  fieldPermissions: {
    showAllergies: true,
    showMedications: true,
    showConditions: true,
    showVitals: true,
    showMedicalHistory: true,
    showTreatmentHistory: true,
    showPsychologicalInfo: false,
    showEmergencyContact: true,
    showInsurance: true
  },
  psychologicalInfo: "Patient has reported mild anxiety related to chronic illness management. Referred to counsellor in Jan 2026. Currently not on any psychiatric medication.",
  consultations: [
    {
      id: "consult-01",
      title: "Pulmonary follow-up",
      specialist: "Dr. Neel Rao",
      date: "2026-04-21T10:30:00.000Z",
      mode: "Virtual",
      status: "Confirmed"
    },
    {
      id: "consult-02",
      title: "Cardiology review",
      specialist: "Dr. Isha Menon",
      date: "2026-04-25T05:30:00.000Z",
      mode: "In Person",
      status: "Scheduled"
    }
  ],
  credentials: [],
  diagnoses: [
    {
      id: "diag-01",
      caseId: "CASE-1024",
      authorName: "Dr. Neel Rao",
      specialty: "Pulmonology",
      note: "Suggest repeat spirometry and compare with last quarter trends before adjusting inhaled corticosteroid dosage.",
      status: "Shared",
      createdAt: "2026-04-17T08:30:00.000Z",
      confidenceScore: 0.91
    },
    {
      id: "diag-02",
      caseId: "CASE-1024",
      authorName: "Dr. Aditi Kapoor",
      specialty: "Internal Medicine",
      note: "Mild tachycardia may be reactive to disrupted sleep pattern. Recommend hydration review and CBC if symptoms persist.",
      status: "Needs Review",
      createdAt: "2026-04-17T10:00:00.000Z",
      confidenceScore: 0.76
    },
    {
      id: "diag-03",
      caseId: "CASE-0931",
      authorName: "Dr. Isha Menon",
      specialty: "Cardiology",
      note: "Previous ECG comparison stable. Continue current beta blocker regimen and reassess after ambulatory monitoring.",
      status: "Resolved",
      createdAt: "2026-04-14T14:15:00.000Z",
      confidenceScore: 0.88
    }
  ],
  medicalRecords: [
    {
      id: "record-01",
      recordedAt: "2026-04-17T07:15:00.000Z",
      bloodPressure: "118/78",
      heartRate: 76,
      oxygenSaturation: 98,
      temperature: "98.4 F",
      heightCm: 167,
      weightKg: 62,
      allergies: ["Penicillin", "Dust"],
      conditions: ["Asthma"],
      medications: ["Montelukast", "Budesonide"]
    },
    {
      id: "record-02",
      recordedAt: "2026-03-29T06:50:00.000Z",
      bloodPressure: "121/80",
      heartRate: 80,
      oxygenSaturation: 97,
      temperature: "98.2 F",
      heightCm: 167,
      weightKg: 61,
      allergies: ["Penicillin", "Dust"],
      conditions: ["Asthma"],
      medications: ["Montelukast"]
    },
    {
      id: "record-03",
      recordedAt: "2026-02-15T05:30:00.000Z",
      bloodPressure: "115/76",
      heartRate: 72,
      oxygenSaturation: 98,
      temperature: "98.1 F",
      heightCm: 167,
      weightKg: 61,
      allergies: ["Penicillin"],
      conditions: ["Asthma"],
      medications: ["Budesonide"]
    }
  ],
  treatmentHistory: [
    {
      id: "treat-01",
      date: "2026-04-17",
      doctorName: "Dr. Neel Rao",
      specialty: "Pulmonology",
      diagnosis: "Moderate persistent asthma",
      treatment: "Increased Budesonide dosage to 400mcg BD. Prescribed Montelukast 10mg OD.",
      notes: "Patient responded well to previous inhaler regimen. Peak flow improved by 18%.",
      followUp: "2026-05-15"
    },
    {
      id: "treat-02",
      date: "2026-01-10",
      doctorName: "Dr. Isha Menon",
      specialty: "Cardiology",
      diagnosis: "Mild tachycardia — stress induced",
      treatment: "Lifestyle modifications. Low-dose beta blocker for 6 weeks.",
      notes: "ECG normal. Holter monitor showed occasional elevated HR during stress.",
      followUp: "2026-04-25"
    },
    {
      id: "treat-03",
      date: "2025-09-03",
      doctorName: "Dr. Priya Nair",
      specialty: "General Medicine",
      diagnosis: "Seasonal allergic rhinitis",
      treatment: "Cetirizine 10mg OD during peak season. Nasal saline rinse recommended.",
      notes: "Allergy panel confirmed dust and pollen sensitivity.",
    }
  ],
  medicalHistory: [
    {
      id: "hist-01",
      date: "2020-06-15",
      type: "Hospitalization",
      title: "Acute asthma exacerbation",
      description: "Admitted for 3 days due to severe bronchospasm. Treated with IV steroids and nebulisation. Discharged with revised inhaler regimen.",
      facility: "Apollo Hospitals, Pune",
      doctorName: "Dr. Neel Rao"
    },
    {
      id: "hist-02",
      date: "2018-03-22",
      type: "Surgery",
      title: "Appendectomy",
      description: "Laparoscopic appendectomy performed under general anaesthesia. Uneventful recovery. Discharged after 2 days.",
      facility: "Ruby Hall Clinic, Pune",
      doctorName: "Dr. Sanjay Mehta"
    },
    {
      id: "hist-03",
      date: "2015-11-10",
      type: "Diagnosis",
      title: "Asthma — initial diagnosis",
      description: "Spirometry confirmed mild persistent asthma. Prescribed low-dose ICS therapy. Triggers identified: dust, cold air, exercise.",
      facility: "Chest & Allergy Clinic, Pune",
      doctorName: "Dr. Arvind Kulkarni"
    },
    {
      id: "hist-04",
      date: "2025-01-20",
      type: "Vaccination",
      title: "Influenza vaccine",
      description: "Annual flu shot administered. No adverse reactions.",
      facility: "Apollo Pharmacy, Pune",
      doctorName: "Dr. Priya Nair"
    }
  ]
};