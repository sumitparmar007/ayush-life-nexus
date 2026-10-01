import * as React from "react";
import Link from "next/link";
import {
  Upload, LinkIcon, FileText, Pill, FlaskConical,
  Shield, ShieldCheck, Settings,
} from "lucide-react";
import { cn } from "@nexus/utils";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  accent: string;    // Tailwind bg class for icon container
  iconColor: string; // Tailwind text class for icon
}

const quickActions: QuickAction[] = [
  {
    id: "upload",
    label: "Upload Record",
    description: "Add a document",
    href: "/records/upload",
    icon: Upload,
    accent: "bg-indigo-100 dark:bg-indigo-950",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    id: "link-abha",
    label: "Link ABHA",
    description: "Connect ABDM",
    href: "/settings/identity",
    icon: LinkIcon,
    accent: "bg-saffron-100 dark:bg-saffron-950",
    iconColor: "text-saffron-600 dark:text-saffron-400",
  },
  {
    id: "records",
    label: "Health Records",
    description: "View all records",
    href: "/records",
    icon: FileText,
    accent: "bg-sage-100 dark:bg-sage-950",
    iconColor: "text-sage-600 dark:text-sage-400",
  },
  {
    id: "medications",
    label: "Medications",
    description: "Track adherence",
    href: "/medications",
    icon: Pill,
    accent: "bg-indigo-100 dark:bg-indigo-950",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    id: "labs",
    label: "Lab Results",
    description: "View reports",
    href: "/labs",
    icon: FlaskConical,
    accent: "bg-amber-100 dark:bg-amber-950",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "insurance",
    label: "Insurance",
    description: "View policies",
    href: "/insurance",
    icon: Shield,
    accent: "bg-neutral-100 dark:bg-neutral-800",
    iconColor: "text-neutral-600 dark:text-neutral-400",
  },
  {
    id: "consent",
    label: "Consent",
    description: "Manage privacy",
    href: "/consent",
    icon: ShieldCheck,
    accent: "bg-sage-100 dark:bg-sage-950",
    iconColor: "text-sage-600 dark:text-sage-400",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Account settings",
    href: "/settings",
    icon: Settings,
    accent: "bg-neutral-100 dark:bg-neutral-800",
    iconColor: "text-neutral-600 dark:text-neutral-400",
  },
];

interface QuickActionsPanelProps {
  className?: string;
}

export function QuickActionsPanel({ className }: QuickActionsPanelProps) {
  return (
    <nav aria-label="Quick actions" className={className}>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 md:grid-cols-8">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.id}
              href={action.href}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl p-3 text-center",
                "border border-transparent",
                "transition-all duration-150 ease-out",
                "hover:border-border hover:bg-card hover:shadow-card",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "active:scale-95"
              )}
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  action.accent
                )}
                aria-hidden="true"
              >
                <Icon className={cn("size-5", action.iconColor)} />
              </span>
              <span className="text-xs font-medium text-foreground leading-tight">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
