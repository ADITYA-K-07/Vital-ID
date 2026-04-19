"use client";

import {
  Activity,
  BrainCircuit,
  FileHeart,
  LayoutDashboard,
  LogOut,
  Menu,
  Stethoscope,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, getAccessLabel } from "@/lib/utils";
import {
  AUTH_COOKIE_NAME,
  AUTH_LICENSE_COOKIE_NAME,
  AUTH_LICENSE_VERIFIED_COOKIE_NAME,
  AUTH_ROLE_COOKIE_NAME,
  createBrowserSupabaseClient
} from "@/lib/supabase/client";
import type { ProfileSummary, SessionRole } from "@/types";

const patientNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Overview & appointments" },
  { href: "/dashboard/identity", label: "Medical ID", icon: FileHeart, description: "Your health record" }
];

const doctorNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Patient lookup" },
  { href: "/dashboard/ai-tools", label: "AI Tools", icon: BrainCircuit, description: "Analyze & detect patterns" },
  { href: "/dashboard/diagnosis", label: "Collaborative Diagnosis", icon: Stethoscope, description: "Global case forum" }
];

interface DashboardSidebarProps {
  demoMode: boolean;
  profile: ProfileSummary;
  viewerRole: SessionRole;
  licenseNumber: string | null;
  licenseVerified: boolean;
}

export function DashboardSidebar({ demoMode, profile, viewerRole, licenseNumber, licenseVerified }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const navigation = viewerRole === "doctor" ? doctorNav : patientNav;

  const qrData = JSON.stringify({
    name: profile.fullName,
    bloodType: profile.bloodType,
    dob: profile.dob,
    emergencyContact: profile.emergencyContact,
    vitalId: profile.id
  });

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
    document.cookie = `${AUTH_ROLE_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
    document.cookie = `${AUTH_LICENSE_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
    document.cookie = `${AUTH_LICENSE_VERIFIED_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
    router.push("/login");
    router.refresh();
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col px-5 py-6">
      {/* Logo */}
      <div className="mb-8 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
            <Activity className="h-5 w-5 text-teal-300" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Vital ID</p>
            <h1 className="font-serif text-xl text-white">Clinical Hub</h1>
          </div>
        </Link>
        <button className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors" onClick={() => setMobileOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Profile card */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-slate-400">
              {viewerRole === "doctor" ? "Logged in as" : "Primary record"}
            </p>
            <h2 className="mt-0.5 text-base font-semibold text-white leading-tight truncate">
              {viewerRole === "doctor" ? `Dr. ${licenseNumber ?? "Verified"}` : profile.fullName}
            </h2>
          </div>
          <Badge className="shrink-0 border-white/10 bg-white/5 text-slate-100 text-[10px]" variant="outline">
            {getAccessLabel(viewerRole)}
          </Badge>
        </div>

        {viewerRole === "patient" && (
          <>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-lg bg-white/5 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Blood Type</p>
                <p className="mt-0.5 text-sm font-semibold text-white">{profile.bloodType}</p>
              </div>
              <div className="rounded-lg bg-white/5 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">DOB</p>
                <p className="mt-0.5 text-sm font-semibold text-white">{profile.dob}</p>
              </div>
            </div>

            {/* Mini QR for sidebar */}
            <div className="border-t border-white/10 pt-3 flex flex-col items-center gap-2">
              <button
                onClick={() => setShowQR(!showQR)}
                className="flex items-center gap-1.5 text-[11px] text-teal-400 hover:text-teal-300 transition-colors"
              >
                <QrCode className="h-3.5 w-3.5" />
                {showQR ? "Hide QR Code" : "My QR Code"}
              </button>
              {showQR && (
                <div className="rounded-xl bg-white p-2 shadow-lg">
                  <QRCodeSVG value={qrData} size={140} level="H" />
                </div>
              )}
            </div>
          </>
        )}

        {viewerRole === "doctor" && (
          <div className="border-t border-white/10 pt-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Licence status</p>
            <p className="text-xs text-teal-300">
              {licenseVerified && licenseNumber ? `✓ Verified — ${licenseNumber}` : "Pending verification"}
            </p>
          </div>
        )}

        {demoMode && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
            <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide">Demo mode</p>
            <p className="text-[10px] text-amber-300/70 mt-0.5">Connect Supabase for live data</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Navigation</p>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive ? "bg-white text-slate-900 shadow-lg shadow-black/20" : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-teal-700" : "text-slate-500 group-hover:text-slate-300")} />
              <div className="min-w-0">
                <span className="block leading-none">{item.label}</span>
                <span className={cn("mt-1 block text-[10px] leading-none truncate", isActive ? "text-slate-500" : "text-slate-600 group-hover:text-slate-500")}>
                  {item.description}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="mt-4 border-t border-white/10 pt-4">
        <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <Activity className="h-4 w-4 text-teal-300" />
          </div>
          <p className="font-serif text-base text-white">Clinical Hub</p>
        </Link>
        <button className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:text-white transition-colors" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />}

      {/* Mobile drawer */}
      <aside className={cn("lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-sidebar text-sidebar-foreground shadow-2xl transition-transform duration-300 ease-in-out", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen lg:w-[280px] lg:flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <SidebarContent />
      </aside>
    </>
  );
}