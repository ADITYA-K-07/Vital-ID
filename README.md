<div align="center">

<br />

```
██╗   ██╗██╗████████╗ █████╗ ██╗         ██╗██████╗
██║   ██║██║╚══██╔══╝██╔══██╗██║         ██║██╔══██╗
██║   ██║██║   ██║   ███████║██║         ██║██║  ██║
╚██╗ ██╔╝██║   ██║   ██╔══██║██║         ██║██║  ██║
 ╚████╔╝ ██║   ██║   ██║  ██║███████╗    ██║██████╔╝
  ╚═══╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝╚═════╝
```

### A secure, privacy-focused clinical hub for managing medical identities,  
### collaborative diagnoses, and verified credentials in healthcare.

<br />

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

<br />

</div>

---

## ✨ What is Vital ID?

**Vital ID** is a modern clinical identity platform built for the real world of healthcare — where seconds matter, privacy is non-negotiable, and collaboration between professionals can save lives.

Patients carry a **unique VitalID** with a scannable QR code. Doctors scan it for **instant emergency access**, or verify credentials manually for routine lookups. Every interaction is role-aware, auditable, and built with HIPAA/GDPR compliance in mind.

---

## 🚀 Features

### 🪪 Medical Identity Management
- Every patient gets a unique **VitalID number** and a downloadable **QR code**
- QR encodes blood type, allergies, medications, conditions & emergency contact
- Patients can **edit their own medical info** directly from their dashboard

### 🔍 Doctor Patient Lookup — Two Access Modes
| Mode | Auth Required | Use Case |
|------|:---:|---|
| 🔑 **Manual VitalID Entry** | ✅ Password | Routine, non-emergency access |
| 📷 **QR Code Scan** | ❌ None | Emergency — instant record access |

> ⚡ QR scan is designed for emergency situations — no password required, immediate full record access.

### 📋 Patient-Controlled Records
Patients can self-report and manage their own history directly on the **Medical ID** page:
- Add **diagnosis history** — diagnosis name, specialty, doctor, treatment, follow-up notes
- Add **medical history events** — surgeries, hospitalisations, procedures, vaccinations
- Delete self-added entries at any time
- All patient-added entries are clearly labelled **"Added by you"**

### 🤝 Collaborative Diagnosis
- Real-time collaboration tools for multi-specialist case discussions
- Global case forum for cross-professional consultation

### 🏅 Verified Credentials
- Blockchain-verified medical licenses and professional credentials
- Role-based access — patients, doctors, and admins see different views

### 🔒 Granular Privacy Controls
- Field-level permissions via `fieldPermissions` — control what each role can see
- Sensitive fields (insurance, emergency contact, vitals) toggle per role
- All data access is logged and auditable

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **UI Library** | React 19 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + PostCSS |
| **Components** | Radix UI primitives |
| **Backend** | Supabase (Auth, Database, Storage) |
| **Icons** | Lucide React |
| **QR Codes** | qrcode.react |
| **Deployment** | Vercel |

---

## 📁 Project Structure

```
vital-id-platform/
│
├── app/                          # Next.js App Router
│   ├── dashboard/
│   │   ├── page.tsx              # Role-split entry (patient vs doctor)
│   │   ├── layout.tsx            # Dashboard shell + sidebar
│   │   ├── identity/
│   │   │   └── page.tsx          # Patient Medical ID page
│   │   ├── diagnosis/
│   │   │   └── page.tsx          # Collaborative Diagnosis forum
│   │   └── ai-tools/
│   │       └── page.tsx          # Doctor AI Tools (doctor only)
│   ├── login/                    # Authentication pages
│   └── globals.css               # Global styles
│
├── components/
│   ├── dashboard/
│   │   ├── sidebar.tsx           # Role-based navigation sidebar
│   │   ├── patient-dashboard.tsx # Patient home — QR + VitalID display
│   │   ├── doctor-dashboard.tsx  # Doctor home — patient lookup
│   │   ├── patient-medical-id.tsx# Full medical ID + add history forms
│   │   └── collaborative-forum.tsx # Case discussion forum
│   └── ui/                       # Base UI components (Radix-based)
│
├── lib/
│   ├── supabase/                 # Supabase client + utilities
│   ├── mock-data.ts              # Demo data for development
│   ├── dashboard-data.ts         # Dashboard data helpers
│   └── utils.ts                  # Shared utilities
│
└── types/
    └── index.ts                  # All TypeScript type definitions
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js **18+**
- npm or yarn
- A [Supabase](https://supabase.com) account

### 1. Clone the repository

```bash
git clone <repository-url>
cd vital-id-platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Configure authentication (Email/Password recommended)
3. Create your database tables (see schema below)
4. Set up **Row Level Security (RLS)** policies for data access control

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄 Database Schema (Recommended)

```sql
-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users primary key,
  role text check (role in ('patient', 'doctor', 'admin')),
  full_name text,
  vital_id text unique,
  blood_type text,
  dob date,
  emergency_contact text,
  insurance_provider text,
  license_number text,        -- doctors only
  license_verified boolean,   -- doctors only
  created_at timestamptz default now()
);

-- Medical Records (vitals history)
create table medical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references profiles(id),
  blood_pressure text,
  heart_rate int,
  oxygen_saturation int,
  temperature text,
  height_cm int,
  weight_kg numeric,
  allergies text[],
  medications text[],
  conditions text[],
  recorded_at timestamptz default now()
);

-- Medical History Events
create table medical_history (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references profiles(id),
  type text,   -- Surgery, Diagnosis, Hospitalization, etc.
  title text,
  description text,
  date date,
  doctor_name text,
  facility text,
  added_by text check (added_by in ('patient', 'doctor')),
  created_at timestamptz default now()
);

-- Treatment / Diagnosis History
create table treatment_history (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references profiles(id),
  diagnosis text,
  specialty text,
  treatment text,
  notes text,
  follow_up text,
  doctor_name text,
  date date,
  added_by text check (added_by in ('patient', 'doctor')),
  created_at timestamptz default now()
);
```

---

## 🏗 Building for Production

```bash
npm run build
npm start
```

Deploy instantly to Vercel:

```bash
npx vercel --prod
```

---

## 🔐 Security & Compliance

> ⚠️ This application handles **sensitive protected health information (PHI)**.

- All database access is controlled by **Supabase Row Level Security (RLS)**
- Role-based access enforced at both the UI and API level
- QR emergency access is **logged and auditable** — implement audit logs before production use
- Ensure compliance with **HIPAA** (US), **GDPR** (EU), or applicable regional health data regulations in your jurisdiction
- Never expose raw patient data in client-side URLs or logs

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes
   ```bash
   git commit -m 'feat: add your feature'
   ```
4. Push to the branch
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

For support, questions, or feature requests — open an issue in this repository or reach out to the development team.

---

<div align="center">

Built with ❤️ for better healthcare

</div>