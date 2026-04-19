"use client";

import {
  BadgeCheck,
  FileBadge2,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  UserRound,
  UserPlus,
  QrCode,
  CheckCircle2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AUTH_COOKIE_NAME,
  AUTH_LICENSE_COOKIE_NAME,
  AUTH_LICENSE_VERIFIED_COOKIE_NAME,
  AUTH_ROLE_COOKIE_NAME,
  DEMO_SESSION_TOKEN,
  createBrowserSupabaseClient,
  hasSupabaseEnv
} from "@/lib/supabase/client";
import type { SessionRole } from "@/types";

function normaliseLicenseNumber(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function isValidLicenseFormat(value: string) {
  return /^[A-Z]{2,6}-?\d{4,10}$/.test(value);
}

function setSessionCookies({
  accessToken,
  role,
  licenseNumber,
  licenseVerified
}: {
  accessToken: string;
  role: SessionRole;
  licenseNumber: string | null;
  licenseVerified: boolean;
}) {
  document.cookie = `${AUTH_COOKIE_NAME}=${accessToken}; path=/; max-age=86400; samesite=lax`;
  document.cookie = `${AUTH_ROLE_COOKIE_NAME}=${role}; path=/; max-age=86400; samesite=lax`;

  if (licenseNumber) {
    document.cookie = `${AUTH_LICENSE_COOKIE_NAME}=${licenseNumber}; path=/; max-age=86400; samesite=lax`;
  } else {
    document.cookie = `${AUTH_LICENSE_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
  }

  document.cookie = `${AUTH_LICENSE_VERIFIED_COOKIE_NAME}=${licenseVerified}; path=/; max-age=86400; samesite=lax`;
}

// Generate a random VitalID
function generateVitalId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "VID-";
  for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

export function LoginForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"patient" | "doctor" | "register">("patient");
  const [mode, setMode] = useState<SessionRole>("patient");

  // Login state
  const [patientEmail, setPatientEmail] = useState("patient@vitalid.demo");
  const [patientPassword, setPatientPassword] = useState("demo-access");
  const [doctorEmail, setDoctorEmail] = useState("doctor@vitalid.demo");
  const [doctorPassword, setDoctorPassword] = useState("demo-access");
  const [licenseNumber, setLicenseNumber] = useState("MED-20458");
  const [verifiedLicenseNumber, setVerifiedLicenseNumber] = useState<string | null>(null);
  const [licenseStatus, setLicenseStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingLicense, setIsVerifyingLicense] = useState(false);

  // Register state
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regBloodType, setRegBloodType] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAllergies, setRegAllergies] = useState("");
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);
  const [generatedVitalId, setGeneratedVitalId] = useState<string | null>(null);

  const isDoctorMode = mode === "doctor";
  const normalizedLicense = normaliseLicenseNumber(licenseNumber);
  const isLicenseVerified = verifiedLicenseNumber === normalizedLicense;

  const handleTabChange = (value: string) => {
    if (value === "patient" || value === "doctor") {
      setMode(value as SessionRole);
    }
    setActiveTab(value as "patient" | "doctor" | "register");
    setErrorMessage(null);
    setRegError(null);
  };

  const handleLicenseChange = (value: string) => {
    setLicenseNumber(value);
    if (verifiedLicenseNumber && normaliseLicenseNumber(value) !== verifiedLicenseNumber) {
      setVerifiedLicenseNumber(null);
      setLicenseStatus("Licence changed. Please verify it again.");
    }
  };

  const verifyDoctorLicense = async () => {
    setErrorMessage(null);
    setLicenseStatus(null);
    setIsVerifyingLicense(true);
    try {
      if (!isValidLicenseFormat(normalizedLicense)) {
        throw new Error("Enter a valid licence number, for example MED-20458.");
      }
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      setVerifiedLicenseNumber(normalizedLicense);
      setLicenseStatus(
        hasSupabaseEnv()
          ? "Licence number verified. Doctor access is unlocked."
          : "Demo licence verification complete."
      );
    } catch (error) {
      setVerifiedLicenseNumber(null);
      setLicenseStatus(error instanceof Error ? error.message : "Licence verification failed.");
    } finally {
      setIsVerifyingLicense(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const email = isDoctorMode ? doctorEmail : patientEmail;
      const password = isDoctorMode ? doctorPassword : patientPassword;

      if (isDoctorMode && !isLicenseVerified) {
        throw new Error("Doctors must verify their licence number before signing in.");
      }

      if (!hasSupabaseEnv()) {
        setSessionCookies({
          accessToken: DEMO_SESSION_TOKEN,
          role: mode,
          licenseNumber: isDoctorMode ? normalizedLicense : null,
          licenseVerified: isDoctorMode
        });
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const supabase = createBrowserSupabaseClient();
      if (!supabase) throw new Error("Supabase client could not be created.");

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session?.access_token) {
        throw new Error(error?.message ?? "Unable to sign in.");
      }

      setSessionCookies({
        accessToken: data.session.access_token,
        role: mode,
        licenseNumber: isDoctorMode ? normalizedLicense : null,
        licenseVerified: isDoctorMode
      });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegError(null);

    if (!regFullName || !regEmail || !regPassword || !regBloodType || !regDob) {
      setRegError("Please fill in all required fields.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError("Passwords do not match.");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("Password must be at least 6 characters.");
      return;
    }

    setRegLoading(true);
    try {
      // Simulate account creation (replace with Supabase signup in production)
      await new Promise((r) => setTimeout(r, 1000));
      const newVitalId = generateVitalId();
      setGeneratedVitalId(newVitalId);
    } catch {
      setRegError("Failed to create account. Please try again.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md overflow-hidden">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-3 text-teal-800">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <span className="data-pill">
            {hasSupabaseEnv() ? "Live auth enabled" : "Demo auth enabled"}
          </span>
        </div>
        <div>
          <CardTitle className="font-serif text-3xl">
            {activeTab === "register" ? "Create your VitalID" : "Secure platform access"}
          </CardTitle>
          <CardDescription className="mt-2 text-sm leading-6">
            {activeTab === "register"
              ? "Register to get your unique VitalID and QR code for instant medical access."
              : "Patients get a privacy-aware view. Doctors unlock the full platform only after licence verification."}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="patient">
              <UserRound className="mr-1.5 h-3.5 w-3.5" />
              Patient
            </TabsTrigger>
            <TabsTrigger value="doctor">
              <FileBadge2 className="mr-1.5 h-3.5 w-3.5" />
              Doctor
            </TabsTrigger>
            <TabsTrigger value="register">
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Register
            </TabsTrigger>
          </TabsList>

          {/* ── PATIENT LOGIN ── */}
          <TabsContent value="patient">
            <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Patient mode hides internal diagnosis notes, clinician-only commentary, and provider-sensitive credential data.
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-email">Email</Label>
                <Input id="patient-email" type="email" value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} placeholder="patient@hospital.org" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-password">Password</Label>
                <Input id="patient-password" type="password" value={patientPassword} onChange={(e) => setPatientPassword(e.target.value)} placeholder="Enter your password" required />
              </div>
              {errorMessage && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div>
              )}
              <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Authorizing</> : <><LockKeyhole className="h-4 w-4" /> Enter patient dashboard</>}
              </Button>
              <p className="text-center text-xs text-slate-500">
                Don't have a VitalID?{" "}
                <button type="button" onClick={() => handleTabChange("register")} className="font-semibold text-teal-700 hover:underline">
                  Create one free
                </button>
              </p>
            </form>
          </TabsContent>

          {/* ── DOCTOR LOGIN ── */}
          <TabsContent value="doctor">
            <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
              <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
                Doctor mode unlocks full medical editing, collaborative diagnosis actions, and the verified credential ledger.
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor-email">Email</Label>
                <Input id="doctor-email" type="email" value={doctorEmail} onChange={(e) => setDoctorEmail(e.target.value)} placeholder="doctor@hospital.org" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor-password">Password</Label>
                <Input id="doctor-password" type="password" value={doctorPassword} onChange={(e) => setDoctorPassword(e.target.value)} placeholder="Enter your password" required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="doctor-license">Licence number</Label>
                  {isLicenseVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <Input id="doctor-license" value={licenseNumber} onChange={(e) => handleLicenseChange(e.target.value)} placeholder="MED-20458" required />
                  <Button type="button" variant="outline" onClick={verifyDoctorLicense} disabled={isVerifyingLicense}>
                    {isVerifyingLicense ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Verifying</> : "Verify"}
                  </Button>
                </div>
                {licenseStatus && (
                  <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">{licenseStatus}</div>
                )}
              </div>
              {errorMessage && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div>
              )}
              <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Authorizing</> : <><LockKeyhole className="h-4 w-4" /> Enter doctor dashboard</>}
              </Button>
            </form>
          </TabsContent>

          {/* ── REGISTER ── */}
          <TabsContent value="register">
            {generatedVitalId ? (
              /* Success screen */
              <div className="mt-5 flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-teal-100 p-4 text-teal-700">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">VitalID Created! 🎉</p>
                  <p className="mt-1 text-sm text-slate-500">Your unique medical identity number is:</p>
                </div>
                <div className="w-full rounded-2xl border-2 border-teal-200 bg-teal-50 px-6 py-4">
                  <p className="text-[10px] uppercase tracking-widest text-teal-600">Your VitalID Number</p>
                  <p className="mt-1 font-mono text-3xl font-bold text-slate-900 tracking-widest">{generatedVitalId}</p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700 text-left w-full">
                  🔒 Save this ID safely. You'll need it for doctor access and emergency situations.
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <QrCode className="h-4 w-4 text-teal-600" />
                  Your QR code will be available after you sign in
                </div>
                <Button
                  className="w-full bg-teal-700 hover:bg-teal-800"
                  onClick={() => handleTabChange("patient")}
                >
                  <LockKeyhole className="mr-2 h-4 w-4" />
                  Sign in to your new account
                </Button>
              </div>
            ) : (
              /* Registration form */
              <form className="mt-5 space-y-4" onSubmit={handleRegister}>
                <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
                  Create your free VitalID — a universal medical identity that gives doctors instant access to your health info in emergencies.
                </div>

                {/* Personal Info */}
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Personal Information</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full Name <span className="text-rose-500">*</span></Label>
                  <Input id="reg-name" placeholder="e.g. Anika Sharma" value={regFullName} onChange={(e) => setRegFullName(e.target.value)} required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="reg-blood">Blood Type <span className="text-rose-500">*</span></Label>
                    <select
                      id="reg-blood"
                      className="flex h-11 w-full rounded-xl border border-input bg-white/90 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={regBloodType}
                      onChange={(e) => setRegBloodType(e.target.value)}
                      required
                    >
                      <option value="">Select</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-dob">Date of Birth <span className="text-rose-500">*</span></Label>
                    <Input id="reg-dob" type="date" value={regDob} onChange={(e) => setRegDob(e.target.value)} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-phone">Emergency Contact</Label>
                  <Input id="reg-phone" placeholder="+91 98765 44321" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-allergies">Known Allergies</Label>
                  <Input id="reg-allergies" placeholder="e.g. Penicillin, Dust (comma separated)" value={regAllergies} onChange={(e) => setRegAllergies(e.target.value)} />
                </div>

                {/* Account Info */}
                <div className="space-y-1 pt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Account Credentials</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email <span className="text-rose-500">*</span></Label>
                  <Input id="reg-email" type="email" placeholder="your@email.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password <span className="text-rose-500">*</span></Label>
                    <Input id="reg-password" type="password" placeholder="Min 6 characters" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-confirm">Confirm Password <span className="text-rose-500">*</span></Label>
                    <Input id="reg-confirm" type="password" placeholder="Repeat password" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} required />
                  </div>
                </div>

                {regError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{regError}</div>
                )}

                <Button className="w-full bg-teal-700 hover:bg-teal-800" size="lg" type="submit" disabled={regLoading}>
                  {regLoading
                    ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Creating your VitalID...</>
                    : <><UserPlus className="h-4 w-4" /> Create My VitalID</>
                  }
                </Button>

                <p className="text-center text-xs text-slate-500">
                  Already have a VitalID?{" "}
                  <button type="button" onClick={() => handleTabChange("patient")} className="font-semibold text-teal-700 hover:underline">
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}