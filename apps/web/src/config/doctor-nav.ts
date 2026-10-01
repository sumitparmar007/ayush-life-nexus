import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  User,
  LogOut,
  Activity,
} from "lucide-react";
import type { NavGroup } from "@/components/layout/nav-types.ts";
import type { CommandGroup } from "@/components/layout/command-palette.tsx";

/**
 * Doctor Portal Active Navigation
 *
 * Contains only implemented, functional routes to prevent dead links.
 */
export const doctorNavGroups: NavGroup[] = [
  {
    id: "main",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/doctor/dashboard",
        icon: LayoutDashboard,
      },
      {
        id: "patients",
        label: "My Patients",
        href: "/doctor/patients",
        icon: Users,
      },
      {
        id: "consent",
        label: "Consent Requests",
        href: "/doctor/consent",
        icon: ShieldCheck,
      },
      {
        id: "activity",
        label: "Activity Log",
        href: "/doctor/activity",
        icon: Activity,
      },
      {
        id: "profile",
        label: "Doctor Profile",
        href: "/doctor/profile",
        icon: User,
      },
    ],
  },
];

/**
 * Doctor Portal Command Palette Groups
 *
 * Exposes only doctor-appropriate commands and actions.
 */
export const doctorCommandGroups: CommandGroup[] = [
  {
    id: "navigation",
    label: "Navigation",
    items: [
      {
        id: "doctor-home",
        label: "Doctor Dashboard",
        description: "Go to Doctor Portal dashboard",
        icon: LayoutDashboard,
        onSelect: () => {
          window.location.href = "/doctor/dashboard";
        },
      },
      {
        id: "doctor-patients",
        label: "Patients & Discovery",
        description: "Find patients by Nexus ID and view authorized patients",
        icon: Users,
        onSelect: () => {
          window.location.href = "/doctor/patients";
        },
      },
      {
        id: "doctor-consent",
        label: "Consent Requests",
        description: "Manage clinical consent requests and authorizations",
        icon: ShieldCheck,
        onSelect: () => {
          window.location.href = "/doctor/consent";
        },
      },
      {
        id: "doctor-activity",
        label: "View Activity",
        description: "View your account, consent, and patient-access audit history",
        icon: Activity,
        onSelect: () => {
          window.location.href = "/doctor/activity";
        },
      },
      {
        id: "doctor-profile",
        label: "Doctor Profile",
        description: "View and edit your professional profile",
        icon: User,
        onSelect: () => {
          window.location.href = "/doctor/profile";
        },
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      {
        id: "doctor-logout",
        label: "Sign Out",
        description: "Sign out of your Doctor account",
        icon: LogOut,
        onSelect: async () => {
          try {
            await fetch("/api/auth/logout", { method: "POST" });
          } finally {
            window.location.href = "/auth/login";
          }
        },
      },
    ],
  },
];
