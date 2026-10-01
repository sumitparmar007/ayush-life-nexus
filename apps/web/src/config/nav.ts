import {
  LayoutDashboard,
  FileText,
  Pill,
  FlaskConical,
  Shield,
  ShieldCheck,
  Settings,
  HelpCircle,
  Activity,
} from "lucide-react";
import type { NavGroup } from "@/components/layout/nav-types.ts";

export const patientNavGroups: NavGroup[] = [
  {
    id: "main",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        id: "records",
        label: "Health Records",
        href: "/records",
        icon: FileText,
      },
      {
        id: "medications",
        label: "Medications",
        href: "/medications",
        icon: Pill,
      },
      {
        id: "labs",
        label: "Lab Results",
        href: "/labs",
        icon: FlaskConical,
      },
      {
        id: "insurance",
        label: "Insurance",
        href: "/insurance",
        icon: Shield,
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      {
        id: "consent",
        label: "Consent & Privacy",
        href: "/consent",
        icon: ShieldCheck,
      },
      {
        id: "activity",
        label: "Activity Log",
        href: "/activity",
        icon: Activity,
      },
      {
        id: "settings",
        label: "Settings",
        href: "/settings",
        icon: Settings,
      },
      {
        id: "help",
        label: "Help & Support",
        href: "/help",
        icon: HelpCircle,
      },
    ],
  },
];
