"use client";

/**
 * Doctor Patient Discovery & Authorized Patients — Phase 11C.
 *
 * Allows authenticated doctors to:
 * 1. Discover a patient using their exact Nexus ID.
 * 2. View minimal safe identity details (no medical records).
 * 3. Initiate a consent access request (creates PENDING_APPROVAL).
 * 4. View currently authorized patients who have granted ACTIVE consent.
 */

import * as React from "react";
import Link from "next/link";
import {
  Search,
  User,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  Loader2,
  RefreshCw,
  Info,
  ArrowRight,
} from "lucide-react";
import { Button, Input, Badge, Alert, AlertDescription } from "@nexus/ui";
import {
  ConsentDataScope,
  ConsentPermission,
  ConsentPurpose,
  CONSENT_DATA_SCOPE_LABELS,
  CONSENT_PURPOSE_LABELS,
  CONSENT_PERMISSION_LABELS,
} from "@/types/consent.ts";
import type { DoctorConsentListItem } from "@/lib/consent-service.ts";

interface PatientLookupResult {
  nexusId: string;
  displayName: string;
  connectionStatus: "ACTIVE" | "PENDING_APPROVAL" | "DISCONNECTED";
  consentDetails?: {
    consentId: string;
    status: string;
    expiresAt: string;
    dataScopes: ConsentDataScope[];
  } | null;
}

export default function DoctorPatientsPage() {
  // Discovery state
  const [searchNexusId, setSearchNexusId] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [lookupResult, setLookupResult] = React.useState<PatientLookupResult | null>(null);
  const [searchError, setSearchError] = React.useState<string | null>(null);

  // Request form state
  const [showRequestModal, setShowRequestModal] = React.useState(false);
  const [selectedScopes, setSelectedScopes] = React.useState<ConsentDataScope[]>([
    ConsentDataScope.HEALTH_RECORDS,
    ConsentDataScope.PRESCRIPTIONS,
    ConsentDataScope.LAB_REPORTS,
  ]);
  const [purpose, setPurpose] = React.useState<ConsentPurpose>(ConsentPurpose.DIRECT_CARE);
  const [permission, setPermission] = React.useState<ConsentPermission>(ConsentPermission.VIEW_ONLY);
  const [expiryDays, setExpiryDays] = React.useState<number>(90);
  const [requestNotes, setRequestNotes] = React.useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = React.useState(false);
  const [requestSuccess, setRequestSuccess] = React.useState<string | null>(null);
  const [requestError, setRequestError] = React.useState<string | null>(null);

  // Authorized patients state
  const [authorizedPatients, setAuthorizedPatients] = React.useState<DoctorConsentListItem[]>([]);
  const [loadingAuthorized, setLoadingAuthorized] = React.useState(true);

  const fetchAuthorized = React.useCallback(async () => {
    setLoadingAuthorized(true);
    try {
      const res = await fetch("/api/doctor/consents?status=ACTIVE");
      if (res.ok) {
        const json = (await res.json()) as { data: { consents: DoctorConsentListItem[] } };
        setAuthorizedPatients(json.data.consents || []);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoadingAuthorized(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchAuthorized();
  }, [fetchAuthorized]);

  // Handle Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchNexusId.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);
    setLookupResult(null);
    setRequestSuccess(null);

    try {
      const res = await fetch(`/api/doctor/patients/lookup?nexusId=${encodeURIComponent(query)}`);
      const json = (await res.json()) as {
        success: boolean;
        data?: PatientLookupResult;
        error?: { message: string };
      };

      if (!res.ok || !json.success) {
        setSearchError(json.error?.message || "Patient not found");
        return;
      }

      if (json.data) {
        setLookupResult(json.data);
      }
    } catch {
      setSearchError("Network error occurred during patient lookup");
    } finally {
      setIsSearching(false);
    }
  };

  // Toggle Scope Checkbox
  const toggleScope = (scope: ConsentDataScope) => {
    setSelectedScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    );
  };

  // Submit Access Request
  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupResult) return;
    if (selectedScopes.length === 0) {
      setRequestError("Please select at least one data scope category");
      return;
    }

    setIsSubmittingRequest(true);
    setRequestError(null);

    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      const res = await fetch("/api/doctor/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientNexusId: lookupResult.nexusId,
          dataScopes: selectedScopes,
          permission,
          purpose,
          expiresAt: expiryDate.toISOString(),
          ...(requestNotes.trim() ? { notes: requestNotes.trim() } : {}),
        }),
      });

      const json = (await res.json()) as {
        success: boolean;
        error?: { message: string };
      };

      if (!res.ok || !json.success) {
        setRequestError(json.error?.message || "Failed to send consent request");
        return;
      }

      setRequestSuccess(`Access request sent to ${lookupResult.displayName}. Awaiting patient approval.`);
      setShowRequestModal(false);
      // Update lookup result connection status
      setLookupResult((prev) =>
        prev ? { ...prev, connectionStatus: "PENDING_APPROVAL" } : null
      );
      void fetchAuthorized();
    } catch {
      setRequestError("Network error occurred while submitting consent request");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <Sparkles className="size-3" />
                Phase 11C
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Patient Discovery & Access
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Find patients by exact Nexus ID and request secure consent for clinical care
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchAuthorized()}
            className="gap-2 self-start sm:self-auto"
            leftIcon={<RefreshCw className={loadingAuthorized ? "animate-spin" : ""} />}
          >
            Refresh
          </Button>
        </div>

        {/* Global Feedback */}
        {requestSuccess && (
          <Alert variant="success" className="animate-fade-in">
            <AlertDescription className="flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              {requestSuccess}
            </AlertDescription>
          </Alert>
        )}

        {/* Section 1: Exact Nexus ID Discovery */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Search className="size-4 text-primary" />
              Patient Discovery
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Enter the patient&apos;s exact unique Nexus ID (e.g. <span className="font-mono">nexus_...</span>). Directory and fuzzy searching are disabled for privacy.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter exact patient Nexus ID (e.g. nexus_...)"
                value={searchNexusId}
                onChange={(e) => setSearchNexusId(e.target.value)}
                required
                className="font-mono text-sm"
              />
            </div>
            <Button
              type="submit"
              isLoading={isSearching}
              className="gap-2 shrink-0 min-w-[130px]"
            >
              <Search className="size-4" />
              Find Patient
            </Button>
          </form>

          {/* Search Error */}
          {searchError && (
            <Alert variant="error" className="animate-fade-in">
              <AlertDescription className="flex items-center gap-2 text-xs">
                <AlertCircle className="size-4 shrink-0" />
                {searchError}
              </AlertDescription>
            </Alert>
          )}

          {/* Search Result Card */}
          {lookupResult && (
            <div className="rounded-xl border border-border/80 bg-muted/30 p-5 animate-fade-in space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <User className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">
                        {lookupResult.displayName}
                      </h3>
                      <Badge
                        variant={
                          lookupResult.connectionStatus === "ACTIVE"
                            ? "success"
                            : lookupResult.connectionStatus === "PENDING_APPROVAL"
                            ? "warning"
                            : "default"
                        }
                      >
                        {lookupResult.connectionStatus === "ACTIVE"
                          ? "ACTIVE CONSENT"
                          : lookupResult.connectionStatus === "PENDING_APPROVAL"
                          ? "REQUEST PENDING"
                          : "NOT CONNECTED"}
                      </Badge>
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      Nexus ID: {lookupResult.nexusId}
                    </p>
                  </div>
                </div>

                {lookupResult.connectionStatus === "DISCONNECTED" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setRequestError(null);
                      setShowRequestModal(true);
                    }}
                    className="gap-2 shrink-0"
                  >
                    <Send className="size-3.5" />
                    Request Access
                  </Button>
                )}

                {lookupResult.connectionStatus === "PENDING_APPROVAL" && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-300">
                    <Clock className="size-3.5 shrink-0" />
                    <span>Awaiting patient approval</span>
                  </div>
                )}

                {lookupResult.connectionStatus === "ACTIVE" && (
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                      <ShieldCheck className="size-3.5 shrink-0" />
                      <span>Authorized Practitioner</span>
                    </div>
                    <Link href={`/doctor/patients/${lookupResult.nexusId}`}>
                      <Button size="sm" className="gap-1.5">
                        <span>View Health Data</span>
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Privacy Notice Banner */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                <Info className="size-3.5 text-muted-foreground shrink-0" />
                <span>
                  In accordance with Nexus privacy rules, clinical data access is gated until the patient grants consent.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Request Access Form Modal / Section */}
        {showRequestModal && lookupResult && (
          <div className="rounded-2xl border border-primary/40 bg-card p-5 sm:p-6 shadow-md animate-fade-in space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Send className="size-4 text-primary" />
                  Request Clinical Data Access from {lookupResult.displayName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select the necessary health data categories and duration for medical consultation
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRequestModal(false)}
              >
                Cancel
              </Button>
            </div>

            {requestError && (
              <Alert variant="error">
                <AlertDescription className="text-xs">{requestError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSendRequest} className="space-y-5">
              {/* Data Scopes Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Requested Data Scopes *
                </label>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {Object.values(ConsentDataScope).map((scope) => {
                    const isChecked = selectedScopes.includes(scope);
                    return (
                      <button
                        type="button"
                        key={scope}
                        onClick={() => toggleScope(scope)}
                        className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                          isChecked
                            ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                            : "border-border bg-card text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border ${
                            isChecked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="size-3.5" />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            {CONSENT_DATA_SCOPE_LABELS[scope] || scope}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Purpose & Permission Grid */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Purpose of Access
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as ConsentPurpose)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {Object.values(ConsentPurpose).map((p) => (
                      <option key={p} value={p}>
                        {CONSENT_PURPOSE_LABELS[p] || p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Access Level
                  </label>
                  <select
                    value={permission}
                    onChange={(e) => setPermission(e.target.value as ConsentPermission)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {Object.values(ConsentPermission).map((perm) => (
                      <option key={perm} value={perm}>
                        {CONSENT_PERMISSION_LABELS[perm] || perm}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Access Duration
                  </label>
                  <select
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value={30}>30 Days</option>
                    <option value={90}>90 Days (Recommended)</option>
                    <option value={180}>6 Months</option>
                    <option value={365}>1 Year</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Input
                  label="Clinical Consultation Notes (optional)"
                  placeholder="e.g. Access requested for cardiology evaluation & follow-up care"
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  isLoading={isSubmittingRequest}
                  className="gap-2 min-w-[160px]"
                >
                  <Send className="size-4" />
                  Send Request
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRequestModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Section 3: Currently Authorized Patients */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                Authorized Patients
              </h2>
              <p className="text-xs text-muted-foreground">
                Patients who have approved active consent requests for clinical care
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {authorizedPatients.length} Authorized
            </span>
          </div>

          {loadingAuthorized ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : authorizedPatients.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center space-y-2">
              <ShieldCheck className="size-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-foreground">No authorized patients yet</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Use the Discovery search above to find patients by exact Nexus ID and request access. Once approved, they will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {authorizedPatients.map((item) => (
                <Link
                  key={item.id}
                  href={`/doctor/patients/${item.nexusId}`}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/50 hover:shadow-sm group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                        <User className="size-5" />
                      </div>
                      <Badge variant="success">ACTIVE</Badge>
                    </div>

                    <h3 className="mt-3 text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {item.patientName}
                    </h3>
                    <p className="font-mono text-xs text-muted-foreground truncate">
                      {item.nexusId}
                    </p>

                    {/* Scopes */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.dataScopes.map((scope) => (
                        <span
                          key={scope}
                          className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                          {CONSENT_DATA_SCOPE_LABELS[scope] || scope}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>Expires: {new Date(item.expiresAt).toLocaleDateString("en-IN")}</span>
                    <span className="text-primary font-medium flex items-center gap-1">
                      View Data
                      <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
