"use client";

/**
 * Doctor Dashboard & Workspace — Phase 11B.
 *
 * Provides a dedicated, professional doctor portal dashboard.
 * Shows real doctor profile data from the authenticated session.
 * Displays honest workspace placeholders with clear roadmap phases.
 * Absolutely NO fake patient counts, NO fake consent statistics, NO fake medical data.
 */

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context.tsx";
import {
  Stethoscope,
  Building2,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Users,
  ShieldCheck,
  Pill,
  Activity,
  User,
  ArrowRight,
  Sparkles,
  Info,
} from "lucide-react";
import { Button, Badge } from "@nexus/ui";

interface DoctorProfileData {
  nexusId: string;
  displayName?: string;
  email?: string;
  specialization?: string;
  qualifications?: string;
  clinicName?: string;
  registrationNumber?: string;
  consultationAddress?: string;
  consultationPhone?: string;
  profileStatus: "ACTIVE" | "INCOMPLETE" | string;
  createdAt: string;
  updatedAt: string;
}

export default function DoctorDashboardPage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = React.useState<DoctorProfileData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchProfile() {
      try {
        const res = await fetch("/api/doctor/profile");
        const json = (await res.json()) as {
          success: boolean;
          data?: DoctorProfileData;
        };
        if (!cancelled && json.success && json.data) {
          setProfile(json.data);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const isActive = profile?.profileStatus === "ACTIVE";

  // Calculate actual field completeness (honest calculation based on real fields)
  const profileFields = React.useMemo(() => {
    if (!profile) return { completed: 0, total: 6, missingRequired: [] as string[] };

    const items = [
      { label: "Display Name", value: profile.displayName, required: true },
      { label: "Specialization", value: profile.specialization, required: true },
      { label: "Clinic / Practice Name", value: profile.clinicName, required: true },
      { label: "Qualifications", value: profile.qualifications, required: false },
      { label: "Registration Number", value: profile.registrationNumber, required: false },
      { label: "Consultation Address", value: profile.consultationAddress, required: false },
    ];

    const completed = items.filter((i) => Boolean(i.value && i.value.trim().length > 0)).length;
    const missingRequired = items
      .filter((i) => i.required && (!i.value || i.value.trim().length === 0))
      .map((i) => i.label);

    return { completed, total: items.length, missingRequired };
  }, [profile]);

  const doctorName = profile?.displayName || user.displayName || "Doctor";
  const formattedDoctorName = doctorName.startsWith("Dr.") ? doctorName : `Dr. ${doctorName}`;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <Sparkles className="size-3" />
                Doctor Portal
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Welcome, {loading ? "Doctor" : formattedDoctorName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ayush-Life Nexus Healthcare Practitioner Workspace
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = "/doctor/profile";
              }}
              className="gap-2"
            >
              <User className="size-4" />
              Edit Profile
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void logout()}
              className="gap-2 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400"
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </div>

        {/* Profile Status & Completion Banner */}
        {!loading && (
          <div
            className={`rounded-2xl border p-5 sm:p-6 transition-all ${
              isActive
                ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                : "border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5">
                <div
                  className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
                    isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                  }`}
                >
                  {isActive ? (
                    <CheckCircle2 className="size-5" />
                  ) : (
                    <AlertCircle className="size-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2
                      className={`text-base font-semibold ${
                        isActive
                          ? "text-emerald-900 dark:text-emerald-100"
                          : "text-amber-900 dark:text-amber-100"
                      }`}
                    >
                      {isActive ? "Doctor Profile Active" : "Profile Incomplete"}
                    </h2>
                    <Badge variant={isActive ? "success" : "warning"}>
                      {isActive ? "ACTIVE" : "INCOMPLETE"}
                    </Badge>
                  </div>
                  <p
                    className={`mt-1 text-xs sm:text-sm ${
                      isActive
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {isActive
                      ? "Your practitioner profile is complete and ready for clinical workspace features."
                      : `Please complete required details (${profileFields.missingRequired.join(
                          ", "
                        )}) to activate your doctor profile.`}
                  </p>
                </div>
              </div>

              {!isActive ? (
                <Button
                  size="sm"
                  onClick={() => {
                    window.location.href = "/doctor/profile";
                  }}
                  className="shrink-0 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
                >
                  Complete Profile
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
              ) : (
                <div className="text-right text-xs text-muted-foreground hidden sm:block">
                  {profileFields.completed} of {profileFields.total} profile details recorded
                </div>
              )}
            </div>
          </div>
        )}

        {/* Doctor Profile Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Identity & Qualifications Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Stethoscope className="size-5" />
              </div>
              <div className="overflow-hidden">
                <h3 className="truncate text-base font-semibold text-foreground">
                  {loading ? "Loading…" : formattedDoctorName}
                </h3>
                <p className="truncate text-xs text-muted-foreground">
                  {loading ? "…" : profile?.specialization || "Specialization not set"}
                </p>
              </div>
            </div>

            <dl className="divide-y divide-border/60 text-sm">
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Specialization</dt>
                <dd className="font-medium text-foreground">
                  {profile?.specialization || "—"}
                </dd>
              </div>
              {profile?.qualifications && (
                <div className="flex justify-between py-2.5">
                  <dt className="text-muted-foreground">Qualifications</dt>
                  <dd className="font-medium text-foreground">
                    {profile.qualifications}
                  </dd>
                </div>
              )}
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Registration No.</dt>
                <dd className="font-medium text-foreground flex items-center gap-1.5">
                  {profile?.registrationNumber ? (
                    <>
                      <span>{profile.registrationNumber}</span>
                      <span className="text-[10px] text-muted-foreground rounded bg-muted px-1.5 py-0.5">
                        Self-reported
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Nexus ID</dt>
                <dd className="font-mono text-xs text-foreground truncate max-w-[200px]">
                  {user.nexusId}
                </dd>
              </div>
            </dl>
          </div>

          {/* Practice & Location Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                <Building2 className="size-5" />
              </div>
              <div className="overflow-hidden">
                <h3 className="truncate text-base font-semibold text-foreground">
                  {loading ? "Loading…" : profile?.clinicName || "Practice location not set"}
                </h3>
                <p className="truncate text-xs text-muted-foreground">Primary Clinic / Hospital</p>
              </div>
            </div>

            <dl className="divide-y divide-border/60 text-sm">
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Clinic / Hospital</dt>
                <dd className="font-medium text-foreground text-right truncate max-w-[220px]">
                  {profile?.clinicName || "—"}
                </dd>
              </div>
              {profile?.consultationAddress && (
                <div className="flex justify-between py-2.5">
                  <dt className="text-muted-foreground">Address</dt>
                  <dd className="font-medium text-foreground text-right max-w-[220px] truncate">
                    {profile.consultationAddress}
                  </dd>
                </div>
              )}
              {profile?.consultationPhone && (
                <div className="flex justify-between py-2.5">
                  <dt className="text-muted-foreground">Consultation Phone</dt>
                  <dd className="font-medium text-foreground">
                    {profile.consultationPhone}
                  </dd>
                </div>
              )}
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium text-foreground">
                  {profile?.email || user.email || "—"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Doctor Workspace Modules Section (Honest Roadmap & Empty States) */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Clinical Workspace
              </h2>
              <p className="text-xs text-muted-foreground">
                Connected modules and upcoming practitioner capabilities
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: My Patients */}
            <Link
              href="/doctor/patients"
              className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 group-hover:scale-105 transition-transform">
                    <Users className="size-5" />
                  </div>
                  <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                    Active
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  My Patients
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Discover patients via exact Nexus ID and view authorized patient connections.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-primary font-medium flex items-center justify-between">
                <span>Open Patient Discovery</span>
                <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* Card 2: Consent Management */}
            <Link
              href="/doctor/consent"
              className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="size-5" />
                  </div>
                  <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                    Active
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  Consent Requests
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Track pending requests and manage time-bound clinical data authorizations.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-primary font-medium flex items-center justify-between">
                <span>View Consent Workspace</span>
                <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* Card 3: Prescriptions & Orders */}
            <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
                    <Pill className="size-5" />
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    Phase 11E
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">Prescriptions</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Digitally prescribe medications directly to patients&apos; accounts.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Info className="size-3.5 shrink-0" />
                <span>Activates in Phase 11E</span>
              </div>
            </div>

            {/* Card 4: Practitioner Audit Log */}
            <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                    <Activity className="size-5" />
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    Phase 11F
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">Activity & Audit</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Immutable practitioner session and data access audit trail.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Info className="size-3.5 shrink-0" />
                <span>Activates in Phase 11F</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links & Info Footer */}
        <div className="rounded-2xl border border-border bg-muted/30 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Doctor Account & Security
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Your doctor account is protected by session encryption and isolated role boundaries.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/doctor/profile"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <User className="size-3.5" />
              Manage Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
