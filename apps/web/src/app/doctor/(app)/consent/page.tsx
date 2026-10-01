"use client";

/**
 * Doctor Consent Requests Workspace — Phase 11C.
 *
 * Displays all consent requests and authorizations initiated by the authenticated doctor.
 * Supports filtering by status (All, Pending Approval, Active, Revoked/Declined) and search.
 */

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  User,
  Plus,
  Lock,
  Loader2,
} from "lucide-react";
import { Button, Input, Badge } from "@nexus/ui";
import {
  ConsentStatus,
  CONSENT_STATUS_LABELS,
  CONSENT_PURPOSE_LABELS,
  CONSENT_DATA_SCOPE_LABELS,
  CONSENT_PERMISSION_LABELS,
} from "@/types/consent.ts";
import type { DoctorConsentListItem } from "@/lib/consent-service.ts";

export default function DoctorConsentPage() {
  const [consents, setConsents] = React.useState<DoctorConsentListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");

  const fetchConsents = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== "ALL") {
        params.set("status", selectedStatus);
      }
      if (search.trim()) {
        params.set("search", search.trim());
      }
      const qs = params.toString();
      const res = await fetch(`/api/doctor/consents${qs ? `?${qs}` : ""}`);
      if (res.ok) {
        const json = (await res.json()) as { data: { consents: DoctorConsentListItem[] } };
        setConsents(json.data.consents || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, search]);

  React.useEffect(() => {
    void fetchConsents();
  }, [fetchConsents]);

  const pendingCount = consents.filter((c) => c.status === "PENDING_APPROVAL").length;
  const activeCount = consents.filter((c) => c.status === "ACTIVE").length;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Consent Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage patient access requests, granted authorizations, and scope permissions
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchConsents()}
              leftIcon={<RefreshCw className={loading ? "animate-spin" : ""} />}
            >
              Refresh
            </Button>
            <Link href="/doctor/patients">
              <Button size="sm" leftIcon={<Plus />}>
                New Request
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "ALL", label: "All Consents" },
              { id: "PENDING_APPROVAL", label: `Pending (${pendingCount})` },
              { id: "ACTIVE", label: `Active (${activeCount})` },
              { id: "REVOKED", label: "Revoked" },
              { id: "REJECTED", label: "Declined" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedStatus === tab.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <Input
              placeholder="Search by patient or Nexus ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        {/* Consents List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : consents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center space-y-3">
            <ShieldCheck className="size-10 text-muted-foreground/40 mx-auto" />
            <h3 className="text-base font-semibold text-foreground">
              No consent requests found
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              You have not sent any consent requests matching this filter. Go to Patient Discovery to find patients and request access.
            </p>
            <Link href="/doctor/patients" className="inline-block pt-2">
              <Button size="sm">Go to Patient Discovery</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {consents.map((item) => {
              const isActive = item.status === "ACTIVE";
              const isPending = item.status === "PENDING_APPROVAL";
              const isRevoked = item.status === "REVOKED";
              const isRejected = item.status === "REJECTED";

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-border/80"
                >
                  <div>
                    {/* Status Badge Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        <User className="size-5" />
                      </div>
                      <Badge
                        variant={
                          isActive
                            ? "success"
                            : isPending
                            ? "warning"
                            : isRevoked || isRejected
                            ? "error"
                            : "default"
                        }
                      >
                        {isActive ? (
                          <CheckCircle2 className="mr-1 size-3" />
                        ) : isPending ? (
                          <Clock className="mr-1 size-3" />
                        ) : isRevoked || isRejected ? (
                          <XCircle className="mr-1 size-3" />
                        ) : (
                          <AlertTriangle className="mr-1 size-3" />
                        )}
                        {CONSENT_STATUS_LABELS[item.status as ConsentStatus] || item.status}
                      </Badge>
                    </div>

                    {/* Patient Name & Nexus ID */}
                    <h3 className="mt-3 text-base font-semibold text-foreground truncate">
                      {item.patientName}
                    </h3>
                    <p className="font-mono text-xs text-muted-foreground truncate">
                      {item.nexusId}
                    </p>

                    {/* Purpose & Permission */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {CONSENT_PURPOSE_LABELS[item.purpose] || item.purpose}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        <Lock className="size-2.5" />
                        {CONSENT_PERMISSION_LABELS[item.permission] || item.permission}
                      </span>
                    </div>

                    {/* Scopes */}
                    <div className="mt-3">
                      <span className="text-[11px] text-muted-foreground block mb-1 font-medium">
                        Requested Data Scopes:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.dataScopes.map((scope) => (
                          <span
                            key={scope}
                            className="rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-foreground"
                          >
                            {CONSENT_DATA_SCOPE_LABELS[scope] || scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer Timestamps */}
                  <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>
                      {isActive
                        ? `Expires: ${new Date(item.expiresAt).toLocaleDateString("en-IN")}`
                        : isPending
                        ? `Requested: ${new Date(item.createdAt).toLocaleDateString("en-IN")}`
                        : `Status: ${item.status}`}
                    </span>
                    <span className="font-medium">
                      {isActive ? "Authorized" : isPending ? "Awaiting Patient" : "Closed"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
