"use client";

import * as React from "react";
import Link from "next/link";
import {
  Shield,
  Building2,
  FileText,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  ExternalLink,
} from "lucide-react";
import { cn } from "@nexus/utils";
import { Badge } from "@nexus/ui";
import {
  InsurancePolicyStatus,
  INSURANCE_POLICY_TYPE_LABELS,
  INSURANCE_POLICY_STATUS_LABELS,
  type InsuranceListItem,
} from "@/types/insurance.ts";
import { format } from "date-fns";

const STATUS_CONFIG: Record<
  InsurancePolicyStatus,
  {
    label: string;
    badgeVariant: "success" | "warning" | "error" | "default";
    bg: string;
    iconColor: string;
    icon: React.ElementType;
  }
> = {
  ACTIVE: {
    label: "Active",
    badgeVariant: "success",
    bg: "bg-sage-100 dark:bg-sage-950",
    iconColor: "text-sage-600 dark:text-sage-400",
    icon: CheckCircle2,
  },
  EXPIRED: {
    label: "Expired",
    badgeVariant: "error",
    bg: "bg-rose-100 dark:bg-rose-950",
    iconColor: "text-rose-600 dark:text-rose-400",
    icon: XCircle,
  },
  GRACE_PERIOD: {
    label: "Grace Period",
    badgeVariant: "warning",
    bg: "bg-amber-100 dark:bg-amber-950",
    iconColor: "text-amber-600 dark:text-amber-400",
    icon: AlertTriangle,
  },
  CANCELLED: {
    label: "Cancelled",
    badgeVariant: "default",
    bg: "bg-neutral-100 dark:bg-neutral-800",
    iconColor: "text-neutral-600 dark:text-neutral-400",
    icon: Clock,
  },
};

export function formatCoverageAmount(amount: number): string {
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  const l = amount / 100000;
  return `₹${l % 1 === 0 ? l.toFixed(0) : l.toFixed(1)} Lakh`;
}

interface InsuranceCardProps {
  policy: InsuranceListItem;
  onDelete?: (id: string) => void;
}

export function InsuranceCard({ policy, onDelete }: InsuranceCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const statusConfig = STATUS_CONFIG[policy.status] ?? STATUS_CONFIG.ACTIVE;
  const StatusIcon = statusConfig.icon;

  React.useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Calculate renewal days countdown
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const expiryUtc = Date.UTC(
    policy.expiryDate.getUTCFullYear(),
    policy.expiryDate.getUTCMonth(),
    policy.expiryDate.getUTCDate()
  );
  const diffDays = Math.round((expiryUtc - todayUtc) / (24 * 60 * 60 * 1000));

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-4",
        "shadow-xs transition-all duration-150 ease-out",
        "hover:border-border/80 hover:shadow-card"
      )}
    >
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                statusConfig.bg
              )}
              aria-hidden="true"
            >
              <Shield className={cn("size-5", statusConfig.iconColor)} />
            </span>
            <div>
              <Link
                href={`/insurance/${policy.id}`}
                className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
              >
                {policy.policyName}
              </Link>
              <p className="text-xs text-muted-foreground">
                {policy.providerName} • <span className="font-mono">{policy.policyNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge variant={statusConfig.badgeVariant} size="sm">
              <StatusIcon className="mr-1 size-3" />
              {INSURANCE_POLICY_STATUS_LABELS[policy.status] || policy.status}
            </Badge>

            {/* Context Menu */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Policy actions"
                aria-expanded={menuOpen}
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg text-muted-foreground",
                  "hover:bg-muted hover:text-foreground transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <MoreVertical className="size-4" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className={cn(
                    "absolute right-0 top-8 z-30 w-44 rounded-xl border border-border bg-card p-1 shadow-modal",
                    "animate-scale-in"
                  )}
                >
                  <Link
                    href={`/insurance/${policy.id}`}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                  >
                    <Eye className="size-3.5 text-muted-foreground" />
                    View details
                  </Link>
                  <Link
                    href={`/insurance/${policy.id}/edit`}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                  >
                    <Edit3 className="size-3.5 text-muted-foreground" />
                    Edit policy
                  </Link>
                  {onDelete && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(policy.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                      Delete policy
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Plan Type Pill */}
        <div className="mt-2.5">
          <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {INSURANCE_POLICY_TYPE_LABELS[policy.policyType] || policy.policyType}
          </span>
        </div>

        {/* Coverage and Renewal Box */}
        <div className="mt-3.5 rounded-xl bg-muted/50 p-3 flex items-baseline justify-between gap-2">
          <div>
            <span className="text-xs text-muted-foreground block mb-0.5">Sum Insured</span>
            <span className="text-lg font-bold tabular-nums text-foreground">
              {formatCoverageAmount(policy.sumInsured)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs text-muted-foreground block mb-0.5">Expires / Renews</span>
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-foreground tabular-nums">
                {format(policy.expiryDate, "dd MMM yyyy")}
              </span>
              {policy.status === "ACTIVE" && (
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    diffDays <= 30
                      ? "text-amber-600 dark:text-amber-400 font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {diffDays === 0
                    ? "Renews today"
                    : diffDays === 1
                    ? "Renews tomorrow"
                    : diffDays > 1
                    ? `in ${diffDays} days`
                    : `Expired ${Math.abs(diffDays)}d ago`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metadata footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {policy.tpaName && (
            <span className="flex items-center gap-1 line-clamp-1 max-w-[150px]">
              <Building2 className="size-3.5 shrink-0 text-muted-foreground/70" />
              TPA: {policy.tpaName}
            </span>
          )}
          {policy.tpaContact && (
            <a
              href={`tel:${policy.tpaContact}`}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Phone className="size-3 shrink-0" />
              <span>{policy.tpaContact}</span>
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          {policy.networkHospitalUrl && (
            <a
              href={policy.networkHospitalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline underline-offset-2"
            >
              <span>Hospitals</span>
              <ExternalLink className="size-3" />
            </a>
          )}

          {policy.policyDocumentRecordId && (
            <Link
              href={`/records/${policy.policyDocumentRecordId}`}
              className="flex items-center gap-1 text-primary hover:underline underline-offset-2"
            >
              <FileText className="size-3.5" />
              <span>Document</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
