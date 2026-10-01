"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  Lock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  MoreVertical,
  Edit3,
  Trash2,
  Check,
  Ban,
} from "lucide-react";
import { cn } from "@nexus/utils";
import { Badge, Button } from "@nexus/ui";
import {
  ConsentStatus,
  CONSENT_STATUS_LABELS,
  CONSENT_RECIPIENT_TYPE_LABELS,
  CONSENT_PURPOSE_LABELS,
  CONSENT_DATA_SCOPE_LABELS,
  CONSENT_PERMISSION_LABELS,
  type ConsentListItem,
} from "@/types/consent.ts";
import { format } from "date-fns";

const STATUS_CONFIG: Record<
  ConsentStatus,
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
  PENDING_APPROVAL: {
    label: "Pending Request",
    badgeVariant: "warning",
    bg: "bg-amber-100 dark:bg-amber-950",
    iconColor: "text-amber-600 dark:text-amber-400",
    icon: AlertTriangle,
  },
  REVOKED: {
    label: "Revoked",
    badgeVariant: "error",
    bg: "bg-rose-100 dark:bg-rose-950",
    iconColor: "text-rose-600 dark:text-rose-400",
    icon: XCircle,
  },
  EXPIRED: {
    label: "Expired",
    badgeVariant: "default",
    bg: "bg-neutral-100 dark:bg-neutral-800",
    iconColor: "text-neutral-600 dark:text-neutral-400",
    icon: Clock,
  },
  REJECTED: {
    label: "Declined",
    badgeVariant: "error",
    bg: "bg-rose-100 dark:bg-rose-950",
    iconColor: "text-rose-600 dark:text-rose-400",
    icon: XCircle,
  },
};

interface ConsentCardProps {
  consent: ConsentListItem;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onRevoke?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ConsentCard({
  consent,
  onApprove,
  onReject,
  onRevoke,
  onDelete,
}: ConsentCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const statusConfig = STATUS_CONFIG[consent.status] ?? STATUS_CONFIG.ACTIVE;
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

  // Expiration countdown
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const expiryUtc = Date.UTC(
    consent.expiresAt.getUTCFullYear(),
    consent.expiresAt.getUTCMonth(),
    consent.expiresAt.getUTCDate()
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
              <ShieldCheck className={cn("size-5", statusConfig.iconColor)} />
            </span>
            <div>
              <Link
                href={`/consent/${consent.id}`}
                className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
              >
                {consent.recipientName}
              </Link>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                <span>
                  {CONSENT_RECIPIENT_TYPE_LABELS[consent.recipientType] ||
                    consent.recipientType}
                </span>
                {consent.organizationName && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building2 className="size-3" />
                      {consent.organizationName}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge variant={statusConfig.badgeVariant} size="sm">
              <StatusIcon className="mr-1 size-3" />
              {CONSENT_STATUS_LABELS[consent.status] || consent.status}
            </Badge>

            {/* Context Menu */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Consent actions"
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
                    href={`/consent/${consent.id}`}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                  >
                    <Eye className="size-3.5 text-muted-foreground" />
                    View details
                  </Link>
                  <Link
                    href={`/consent/${consent.id}/edit`}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                  >
                    <Edit3 className="size-3.5 text-muted-foreground" />
                    Edit consent
                  </Link>
                  {consent.status === "ACTIVE" && onRevoke && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onRevoke(consent.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
                    >
                      <Ban className="size-3.5" />
                      Revoke access
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(consent.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                      Delete record
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Purpose & Permission Info */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {CONSENT_PURPOSE_LABELS[consent.purpose] || consent.purpose}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            <Lock className="size-3" />
            {CONSENT_PERMISSION_LABELS[consent.permission] || consent.permission}
          </span>
        </div>

        {/* Permitted Data Scopes */}
        <div className="mt-3">
          <span className="text-xs text-muted-foreground block mb-1 font-medium">
            Permitted Data Scopes:
          </span>
          <div className="flex flex-wrap gap-1">
            {consent.dataScopes.map((scope) => (
              <span
                key={scope}
                className="inline-block rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] text-foreground font-medium"
              >
                {CONSENT_DATA_SCOPE_LABELS[scope] || scope}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / Validity and Quick Actions */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
        <div>
          <span>
            {consent.status === "ACTIVE"
              ? diffDays <= 0
                ? "Expires today"
                : diffDays === 1
                ? "Expires tomorrow"
                : `Valid for ${diffDays} days`
              : consent.status === "PENDING_APPROVAL"
              ? "Awaiting your approval"
              : consent.status === "REVOKED"
              ? "Access revoked"
              : `Expired on ${format(consent.expiresAt, "dd MMM yyyy")}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {consent.status === "PENDING_APPROVAL" && (
            <>
              {onApprove && (
                <Button
                  size="sm"
                  variant="primary"
                  className="h-7 text-xs px-2.5"
                  leftIcon={<Check className="size-3.5" />}
                  onClick={() => onApprove(consent.id)}
                >
                  Approve
                </Button>
              )}
              {onReject && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950"
                  onClick={() => onReject(consent.id)}
                >
                  Reject
                </Button>
              )}
            </>
          )}

          {consent.status === "ACTIVE" && onRevoke && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950"
              onClick={() => onRevoke(consent.id)}
            >
              Revoke
            </Button>
          )}

          <Link href={`/consent/${consent.id}`}>
            <Button size="sm" variant="ghost" className="h-7 text-xs px-2">
              Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
