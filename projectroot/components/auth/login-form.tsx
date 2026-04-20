"use client";

import {
  BadgeCheck,
  CheckCircle2,
  FileBadge2,
  LoaderCircle,
  LockKeyhole,
  QrCode,
  ShieldCheck,
  UserPlus,
  UserRound
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
  type ApiSessionBootstrapRequest,
  type ApiSessionBootstrapResponse,
  fetchFastApiJson
} from "@/lib/fastapi";
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  return fallback;
}

function getSignupFailureMessage({
  errorMessage,
  hasUser,
  hasSession
}: {
  errorMessage?: string | null;
  hasUser: boolean;
  hasSession: boolean;
}) {
  if (errorMessage) {
    return `Signup failed: ${errorMessage}`;
  }

  if (hasUser && !hasSession) {
    return "Signup succeeded, but Supabase did not return a session. Email confirmation is probably enabled. Disable email confirmation for local/dev instant signup, then try again.";
  }

  return "Signup failed: Unable to create account.";
}

export function LoginForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"patient" | "doctor" | "register">("patient");
  const [mode, setMode] = useState<SessionRole>("patient");
  const [registerRole, setRegisterRole] = useState<SessionRole>("patient");

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
  const [regMedicalId, setRegMedicalId] = useState("");
  const [regBloodType, setRegBloodType] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAllergies, setRegAllergies] = useState("");
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);
  const [generatedVitalId, setGeneratedVitalId] = useState<string | null>(null);
  const [registrationSuccessRole, setRegistrationSuccessRole] = useState<SessionRole | null>(null);

  const isDoctorMode = mode === "doctor";
  const isDoctorRegister = registerRole === "doctor";
  const normalizedLicense = normaliseLicenseNumber(licenseNumber);
  const isLicenseVerified = verifiedLicenseNumber === normalizedLicense;

  const clearRegistrationFeedback = () => {
    setRegError(null);
    setGeneratedVitalId(null);
    setRegistrationSuccessRole(null);
  };

  const handleTabChange = (value: string) => {
    if (value === "patient" || value === "doctor") {
      setMode(value as SessionRole);
    }

    setActiveTab(value as "patient" | "doctor" | "register");
    setErrorMessage(null);

    if (value !== "register") {
      clearRegistrationFeedback();
    } else {
      setRegError(null);
    }
  };

  const openRegister = (role: SessionRole) => {
    setRegisterRole(role);
    setActiveTab("register");
    setErrorMessage(null);
    clearRegistrationFeedback();
  };

  const handleRegisterRoleChange = (role: SessionRole) => {
    setRegisterRole(role);
    clearRegistrationFeedback();
  };

  const handleLicenseChange = (value: string) => {
    setLicenseNumber(value);
    if (verifiedLicenseNumber && normaliseLicenseNumber(value) !== verifiedLicenseNumber) {
      setVerifiedLicenseNumber(null);
      setLicenseStatus("Medical ID changed. Please verify it again.");
    }
  };

  const verifyDoctorLicense = async () => {
    setErrorMessage(null);
    setLicenseStatus(null);
    setIsVerifyingLicense(true);

    try {
      if (!normalizedLicense) {
        throw new Error("Enter a medical ID to verify.");
      }

      await new Promise((resolve) => window.setTimeout(resolve, hasSupabaseEnv() ? 300 : 500));
      setVerifiedLicenseNumber(normalizedLicense);
      setLicenseStatus("Medical ID verified for this session.");
    } catch (error) {
      setVerifiedLicenseNumber(null);
      setLicenseStatus(error instanceof Error ? error.message : "Medical ID verification failed.");
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
        throw new Error("Doctors must verify their medical ID before signing in.");
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

      const bootstrapPayload: ApiSessionBootstrapRequest = {
        role: mode,
        license_number: isDoctorMode ? normalizedLicense : null
      };
      const bootstrap = await fetchFastApiJson<ApiSessionBootstrapResponse>("/api/session/bootstrap", {
        method: "POST",
        accessToken: data.session.access_token,
        body: JSON.stringify(bootstrapPayload)
      });

      setSessionCookies({
        accessToken: data.session.access_token,
        role: bootstrap.role,
        licenseNumber: bootstrap.license_number ?? null,
        licenseVerified: bootstrap.license_verified ?? false
      });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearRegistrationFeedback();

    const normalizedMedicalId = normaliseLicenseNumber(regMedicalId);

    if (
      !regFullName ||
      !regEmail ||
      !regPassword ||
      !regConfirmPassword ||
      (isDoctorRegister ? !normalizedMedicalId : !regBloodType || !regDob)
    ) {
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
      if (!hasSupabaseEnv()) {
        await new Promise((resolve) => window.setTimeout(resolve, 1000));

        if (isDoctorRegister) {
          setDoctorEmail(regEmail);
          setDoctorPassword(regPassword);
          setLicenseNumber(regMedicalId);
          setVerifiedLicenseNumber(normalizedMedicalId);
          setLicenseStatus("Medical ID verified for this session.");
          setRegistrationSuccessRole("doctor");
        } else {
          setGeneratedVitalId("VID-01DEMO");
          setRegistrationSuccessRole("patient");
        }

        return;
      }

      const supabase = createBrowserSupabaseClient();
      if (!supabase) throw new Error("Supabase client could not be created.");

      const signupPayload = {
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            name: regFullName,
            role: registerRole
          }
        }
      };

      const { data, error } = await supabase.auth.signUp(signupPayload);
      const accessToken = data.session?.access_token ?? null;

      if (error || !accessToken) {
        const message = getSignupFailureMessage({
          errorMessage: error?.message,
          hasUser: Boolean(data.user),
          hasSession: Boolean(accessToken)
        });
        console.error(`${isDoctorRegister ? "Doctor" : "Patient"} registration signup failed.`, {
          email: regEmail,
          phase: "signup",
          userId: data.user?.id ?? null,
          error
        });
        throw new Error(message);
      }

      const bootstrapPayload = isDoctorRegister
        ? ({
            role: "doctor",
            full_name: regFullName,
            license_number: normalizedMedicalId
          } satisfies ApiSessionBootstrapRequest)
        : ({
            role: "patient",
            full_name: regFullName,
            blood_group: regBloodType,
            dob: regDob,
            emergency_contact: regPhone || null,
            allergies: regAllergies
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          } satisfies ApiSessionBootstrapRequest);

      let bootstrap: ApiSessionBootstrapResponse;
      try {
        bootstrap = await fetchFastApiJson<ApiSessionBootstrapResponse>("/api/session/bootstrap", {
          method: "POST",
          accessToken,
          body: JSON.stringify(bootstrapPayload)
        });
      } catch (error) {
        console.error(`${isDoctorRegister ? "Doctor" : "Patient"} registration bootstrap failed.`, {
          email: regEmail,
          phase: "bootstrap",
          userId: data.user?.id ?? null,
          payload: bootstrapPayload,
          error
        });
        throw new Error(
          `Account created, but profile setup failed: ${getErrorMessage(
            error,
            "Session bootstrap failed."
          )}`
        );
      }

      if (isDoctorRegister) {
        setDoctorEmail(regEmail);
        setDoctorPassword(regPassword);
        setLicenseNumber(regMedicalId);
        setVerifiedLicenseNumber(normalizedMedicalId);
        setLicenseStatus("Medical ID verified for this session.");
        setRegistrationSuccessRole("doctor");
      } else {
        setPatientEmail(regEmail);
        setPatientPassword(regPassword);
        setGeneratedVitalId(bootstrap.vital_id ?? null);
        setRegistrationSuccessRole("patient");
      }
    } catch (error) {
      setRegError(getErrorMessage(error, "Failed to create account. Please try again."));
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
            {activeTab === "register"
              ? isDoctorRegister
                ? "Create your doctor account"
                : "Create your VitalID"
              : "Secure platform access"}
          </CardTitle>
          <CardDescription className="mt-2 text-sm leading-6">
            {activeTab === "register"
              ? isDoctorRegister
                ? "Register as a doctor with your name, email, and medical ID. Medical ID verification is temporarily accepted on entry."
                : "Register to get your unique VitalID and QR code for instant medical access."
              : "Patients get a privacy-aware view. Doctors unlock the full platform after medical ID verification."}
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

          <TabsContent value="patient">
            <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Patient mode hides internal diagnosis notes, clinician-only commentary, and provider-sensitive credential data.
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-email">Email</Label>
                <Input
                  id="patient-email"
                  type="email"
                  value={patientEmail}
                  onChange={(event) => setPatientEmail(event.target.value)}
                  placeholder="patient@hospital.org"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-password">Password</Label>
                <Input
                  id="patient-password"
                  type="password"
                  value={patientPassword}
                  onChange={(event) => setPatientPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              {errorMessage && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              )}
              <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Authorizing
                  </>
                ) : (
                  <>
                    <LockKeyhole className="h-4 w-4" /> Enter patient dashboard
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-slate-500">
                Don't have a VitalID?{" "}
                <button
                  type="button"
                  onClick={() => openRegister("patient")}
                  className="font-semibold text-teal-700 hover:underline"
                  suppressHydrationWarning
                >
                  Create one free
                </button>
              </p>
            </form>
          </TabsContent>

          <TabsContent value="doctor">
            <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
              <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
                Doctor mode unlocks full medical editing, collaborative diagnosis actions, and the verified credential ledger.
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor-email">Email</Label>
                <Input
                  id="doctor-email"
                  type="email"
                  value={doctorEmail}
                  onChange={(event) => setDoctorEmail(event.target.value)}
                  placeholder="doctor@hospital.org"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor-password">Password</Label>
                <Input
                  id="doctor-password"
                  type="password"
                  value={doctorPassword}
                  onChange={(event) => setDoctorPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="doctor-license">Medical ID</Label>
                  {isLicenseVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <Input
                    id="doctor-license"
                    value={licenseNumber}
                    onChange={(event) => handleLicenseChange(event.target.value)}
                    placeholder="Enter your medical ID"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={verifyDoctorLicense}
                    disabled={isVerifyingLicense}
                  >
                    {isVerifyingLicense ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" /> Verifying
                      </>
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
                {licenseStatus && (
                  <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
                    {licenseStatus}
                  </div>
                )}
              </div>
              {errorMessage && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              )}
              <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Authorizing
                  </>
                ) : (
                  <>
                    <LockKeyhole className="h-4 w-4" /> Enter doctor dashboard
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <div className="grid grid-cols-2 gap-1">
                {(["patient", "doctor"] as const).map((role) => {
                  const isActive = registerRole === role;

                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRegisterRoleChange(role)}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {role === "patient" ? "Patient signup" : "Doctor signup"}
                    </button>
                  );
                })}
              </div>
            </div>

            {registrationSuccessRole === "patient" ? (
              <div className="mt-5 flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-teal-100 p-4 text-teal-700">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">VitalID Created!</p>
                  <p className="mt-1 text-sm text-slate-500">Your unique medical identity number is:</p>
                </div>
                <div className="w-full rounded-2xl border-2 border-teal-200 bg-teal-50 px-6 py-4">
                  <p className="text-[10px] uppercase tracking-widest text-teal-600">Your VitalID Number</p>
                  <p className="mt-1 font-mono text-3xl font-bold tracking-widest text-slate-900">
                    {generatedVitalId}
                  </p>
                </div>
                <div className="w-full rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-left text-xs text-amber-700">
                  Save this ID safely. You'll need it for doctor access and emergency situations.
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
            ) : registrationSuccessRole === "doctor" ? (
              <div className="mt-5 flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-teal-100 p-4 text-teal-700">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">Doctor account created</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Your medical ID has been accepted and marked verified for sign-in.
                  </p>
                </div>
                <div className="w-full rounded-2xl border border-teal-200 bg-teal-50 px-6 py-4 text-left">
                  <p className="text-[10px] uppercase tracking-widest text-teal-600">Verified Medical ID</p>
                  <p className="mt-1 font-mono text-xl font-bold tracking-wide text-slate-900">
                    {regMedicalId}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Continue to doctor sign-in to access the verified clinician workspace.
                </div>
                <Button
                  className="w-full bg-teal-700 hover:bg-teal-800"
                  onClick={() => handleTabChange("doctor")}
                >
                  <LockKeyhole className="mr-2 h-4 w-4" />
                  Go to doctor sign in
                </Button>
              </div>
            ) : (
              <form className="mt-5 space-y-4" onSubmit={handleRegister}>
                <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
                  {isDoctorRegister
                    ? "Create your doctor account. For now, any medical ID you enter is accepted as verified."
                    : "Create your free VitalID - a universal medical identity that gives doctors instant access to your health info in emergencies."}
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Personal Information
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-name">
                    Full Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="reg-name"
                    placeholder="e.g. Anika Sharma"
                    value={regFullName}
                    onChange={(event) => setRegFullName(event.target.value)}
                    required
                  />
                </div>

                {isDoctorRegister ? (
                  <div className="space-y-2">
                    <Label htmlFor="reg-medical-id">
                      Medical ID <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="reg-medical-id"
                      placeholder="Enter your medical ID"
                      value={regMedicalId}
                      onChange={(event) => setRegMedicalId(event.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="reg-blood">
                          Blood Type <span className="text-rose-500">*</span>
                        </Label>
                        <select
                          id="reg-blood"
                          className="flex h-11 w-full rounded-xl border border-input bg-white/90 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={regBloodType}
                          onChange={(event) => setRegBloodType(event.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-dob">
                          Date of Birth <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          id="reg-dob"
                          type="date"
                          value={regDob}
                          onChange={(event) => setRegDob(event.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-phone">Emergency Contact</Label>
                      <Input
                        id="reg-phone"
                        placeholder="+91 98765 44321"
                        value={regPhone}
                        onChange={(event) => setRegPhone(event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-allergies">Known Allergies</Label>
                      <Input
                        id="reg-allergies"
                        placeholder="e.g. Penicillin, Dust (comma separated)"
                        value={regAllergies}
                        onChange={(event) => setRegAllergies(event.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1 pt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Account Credentials
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email">
                    Email <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="your@email.com"
                    value={regEmail}
                    onChange={(event) => setRegEmail(event.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">
                      Password <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={regPassword}
                      onChange={(event) => setRegPassword(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-confirm">
                      Confirm Password <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="reg-confirm"
                      type="password"
                      placeholder="Repeat password"
                      value={regConfirmPassword}
                      onChange={(event) => setRegConfirmPassword(event.target.value)}
                      required
                    />
                  </div>
                </div>

                {regError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {regError}
                  </div>
                )}

                <Button className="w-full bg-teal-700 hover:bg-teal-800" size="lg" type="submit" disabled={regLoading}>
                  {regLoading ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />{" "}
                      {isDoctorRegister ? "Creating doctor account..." : "Creating your VitalID..."}
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />{" "}
                      {isDoctorRegister ? "Create doctor account" : "Create My VitalID"}
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-slate-500">
                  {isDoctorRegister ? "Already have a doctor account? " : "Already have a VitalID? "}
                  <button
                    type="button"
                    onClick={() => handleTabChange(isDoctorRegister ? "doctor" : "patient")}
                    className="font-semibold text-teal-700 hover:underline"
                    suppressHydrationWarning
                  >
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
