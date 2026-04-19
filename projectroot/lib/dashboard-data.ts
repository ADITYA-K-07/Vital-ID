import { cookies } from "next/headers";

import {
  type ApiMeResponse,
  type ApiPatientIdentityResponse,
  type ApiPatientDashboardResponse,
  fetchFastApiJson,
  mapPatientResponseToDashboardData
} from "@/lib/fastapi";
import { mockDashboardData } from "@/lib/mock-data";
import {
  AUTH_COOKIE_NAME,
  AUTH_LICENSE_COOKIE_NAME,
  AUTH_LICENSE_VERIFIED_COOKIE_NAME,
  AUTH_ROLE_COOKIE_NAME,
  DEMO_SESSION_TOKEN,
  hasSupabaseEnv,
  isSessionRole
} from "@/lib/supabase/client";
import type { DashboardData } from "@/types";

export async function getDashboardData(): Promise<DashboardData> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const roleValue = cookieStore.get(AUTH_ROLE_COOKIE_NAME)?.value;
  const viewerRole = isSessionRole(roleValue) ? roleValue : "patient";
  const viewer = {
    role: viewerRole,
    canViewSensitive: viewerRole === "doctor",
    licenseNumber: cookieStore.get(AUTH_LICENSE_COOKIE_NAME)?.value ?? null,
    licenseVerified: cookieStore.get(AUTH_LICENSE_VERIFIED_COOKIE_NAME)?.value === "true"
  };

  if (!hasSupabaseEnv() || !accessToken || accessToken === DEMO_SESSION_TOKEN) {
    return { ...mockDashboardData, viewer };
  }

  try {
    if (viewerRole === "patient") {
      const data = await fetchFastApiJson<ApiPatientDashboardResponse>("/api/dashboard/patient", {
        accessToken
      });
      return mapPatientResponseToDashboardData(data, viewer);
    }

    const me = await fetchFastApiJson<ApiMeResponse>("/api/me", {
      accessToken
    });

    return {
      ...mockDashboardData,
      demoMode: false,
      viewer,
      profile: {
        ...mockDashboardData.profile,
        id: me.profile_id,
        fullName: me.name,
        role: "Doctor"
      },
      diagnoses: [],
      consultations: [],
      alerts: []
    };
  } catch {
    return { ...mockDashboardData, viewer };
  }
}

export async function getPatientIdentityData(): Promise<DashboardData> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const roleValue = cookieStore.get(AUTH_ROLE_COOKIE_NAME)?.value;
  const viewerRole = isSessionRole(roleValue) ? roleValue : "patient";
  const viewer = {
    role: viewerRole,
    canViewSensitive: viewerRole === "doctor",
    licenseNumber: cookieStore.get(AUTH_LICENSE_COOKIE_NAME)?.value ?? null,
    licenseVerified: cookieStore.get(AUTH_LICENSE_VERIFIED_COOKIE_NAME)?.value === "true"
  };

  if (!hasSupabaseEnv() || !accessToken || accessToken === DEMO_SESSION_TOKEN) {
    return { ...mockDashboardData, viewer };
  }

  try {
    const data = await fetchFastApiJson<ApiPatientIdentityResponse>("/api/patients/me/identity", {
      accessToken
    });
    return mapPatientResponseToDashboardData(data, viewer);
  } catch {
    return { ...mockDashboardData, viewer };
  }
}
