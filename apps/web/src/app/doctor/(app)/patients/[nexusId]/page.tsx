"use client";

/**
 * Doctor Patient Detail & Authorized Health Data Workspace — Phase 11D
 *
 * Route: /doctor/patients/[nexusId]
 *
 * Displays authorized, read-only health information for a specific patient
 * strictly gated by the patient's ACTIVE consent scopes.
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  ShieldCheck,
  Lock,
  FileText,
  Pill,
  FlaskConical,
  RefreshCw,
  Loader2,
  Plus,
} from "lucide-react";
import { Button, Input, Badge, Alert, AlertDescription } from "@nexus/ui";
import {
  ConsentDataScope,
  type ConsentStatus,
  CONSENT_DATA_SCOPE_LABELS,
} from "@/types/consent.ts";
import type { HealthRecordListItem } from "@/types/health-records.ts";
import type { MedicationListItem } from "@/types/medications.ts";
import type { LabListItem } from "@/types/labs.ts";
import { DoctorPrescriptionDialog } from "@/components/doctor/doctor-prescription-dialog.tsx";

interface PatientIdentityData {
  nexusId: string;
  displayName: string;
  connectionStatus: "ACTIVE" | "PENDING_APPROVAL" | "DISCONNECTED";
  consentDetails?: {
    consentId: string;
    status: ConsentStatus;
    expiresAt: string;
    dataScopes: ConsentDataScope[];
    permission?: string;
    purpose?: string;
  } | null;
}

export default function DoctorPatientDetailPage() {
  const params = useParams();
  const nexusId = typeof params?.nexusId === "string" ? params.nexusId : "";

  // Patient metadata state
  const [patient, setPatient] = React.useState<PatientIdentityData | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = React.useState(true);
  const [patientError, setPatientError] = React.useState<string | null>(null);

  // Active tab state
  const [activeTab, setActiveTab] = React.useState<"records" | "medications" | "labs">("records");

  // Health records state
  const [records, setRecords] = React.useState<HealthRecordListItem[]>([]);
  const [loadingRecords, setLoadingRecords] = React.useState(false);
  const [recordsSearch, setRecordsSearch] = React.useState("");

  // Medications state
  const [medications, setMedications] = React.useState<MedicationListItem[]>([]);
  const [loadingMedications, setLoadingMedications] = React.useState(false);
  const [medsSearch, setMedsSearch] = React.useState("");
  const [showPrescribeDialog, setShowPrescribeDialog] = React.useState(false);

  // Labs state
  const [labs, setLabs] = React.useState<LabListItem[]>([]);
  const [loadingLabs, setLoadingLabs] = React.useState(false);
  const [labsSearch, setLabsSearch] = React.useState("");

  // 1. Fetch Patient Identity & Consent Status
  const fetchPatientInfo = React.useCallback(async () => {
    if (!nexusId) return;
    setIsLoadingPatient(true);
    setPatientError(null);

    try {
      const res = await fetch(`/api/doctor/patients/lookup?nexusId=${encodeURIComponent(nexusId)}`);
      const json = (await res.json()) as {
        success: boolean;
        data?: PatientIdentityData;
        error?: { message: string };
      };

      if (!res.ok || !json.success) {
        setPatientError(json.error?.message || "Patient not found");
        return;
      }

      if (json.data) {
        setPatient(json.data);
      }
    } catch {
      setPatientError("Failed to load patient information");
    } finally {
      setIsLoadingPatient(false);
    }
  }, [nexusId]);

  React.useEffect(() => {
    void fetchPatientInfo();
  }, [fetchPatientInfo]);

  // Derived scope permissions
  const consent = patient?.consentDetails;
  const isConsentActive = patient?.connectionStatus === "ACTIVE" && consent?.status === "ACTIVE";
  const scopes = consent?.dataScopes || [];

  const hasRecordsScope = isConsentActive && (scopes.includes(ConsentDataScope.HEALTH_RECORDS) || scopes.includes(ConsentDataScope.ALL_DATA));
  const hasMedicationsScope = isConsentActive && (scopes.includes(ConsentDataScope.PRESCRIPTIONS) || scopes.includes(ConsentDataScope.ALL_DATA));
  const hasLabsScope = isConsentActive && (scopes.includes(ConsentDataScope.LAB_REPORTS) || scopes.includes(ConsentDataScope.ALL_DATA));

  // Automatically select first available tab if current tab is locked
  React.useEffect(() => {
    if (isConsentActive) {
      if (activeTab === "records" && !hasRecordsScope) {
        if (hasMedicationsScope) setActiveTab("medications");
        else if (hasLabsScope) setActiveTab("labs");
      } else if (activeTab === "medications" && !hasMedicationsScope) {
        if (hasRecordsScope) setActiveTab("records");
        else if (hasLabsScope) setActiveTab("labs");
      } else if (activeTab === "labs" && !hasLabsScope) {
        if (hasRecordsScope) setActiveTab("records");
        else if (hasMedicationsScope) setActiveTab("medications");
      }
    }
  }, [isConsentActive, hasRecordsScope, hasMedicationsScope, hasLabsScope, activeTab]);

  // 2. Fetch Records when Tab Active & Scope Granted
  const fetchRecords = React.useCallback(async () => {
    if (!hasRecordsScope || !nexusId) return;
    setLoadingRecords(true);
    try {
      const res = await fetch(`/api/doctor/patients/${nexusId}/records`);
      if (res.ok) {
        const json = (await res.json()) as { data: { records: HealthRecordListItem[] } };
        setRecords(json.data.records || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingRecords(false);
    }
  }, [hasRecordsScope, nexusId]);

  // 3. Fetch Medications when Tab Active & Scope Granted
  const fetchMedications = React.useCallback(async () => {
    if (!hasMedicationsScope || !nexusId) return;
    setLoadingMedications(true);
    try {
      const res = await fetch(`/api/doctor/patients/${nexusId}/medications`);
      if (res.ok) {
        const json = (await res.json()) as { data: { medications: MedicationListItem[] } };
        setMedications(json.data.medications || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingMedications(false);
    }
  }, [hasMedicationsScope, nexusId]);

  // 4. Fetch Labs when Tab Active & Scope Granted
  const fetchLabs = React.useCallback(async () => {
    if (!hasLabsScope || !nexusId) return;
    setLoadingLabs(true);
    try {
      const res = await fetch(`/api/doctor/patients/${nexusId}/labs`);
      if (res.ok) {
        const json = (await res.json()) as { data: { labs: LabListItem[] } };
        setLabs(json.data.labs || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingLabs(false);
    }
  }, [hasLabsScope, nexusId]);

  React.useEffect(() => {
    if (activeTab === "records" && hasRecordsScope) {
      void fetchRecords();
    } else if (activeTab === "medications" && hasMedicationsScope) {
      void fetchMedications();
    } else if (activeTab === "labs" && hasLabsScope) {
      void fetchLabs();
    }
  }, [activeTab, hasRecordsScope, hasMedicationsScope, hasLabsScope, fetchRecords, fetchMedications, fetchLabs]);

  // Expiry calculation
  const expiresDate = consent?.expiresAt ? new Date(consent.expiresAt) : null;
  const isExpired = expiresDate ? expiresDate.getTime() < Date.now() : false;

  // Filtered lists for UI
  const filteredRecords = records.filter(
    (r) =>
      r.title.toLowerCase().includes(recordsSearch.toLowerCase()) ||
      r.category.toLowerCase().includes(recordsSearch.toLowerCase())
  );

  const filteredMeds = medications.filter(
    (m) =>
      m.name.toLowerCase().includes(medsSearch.toLowerCase()) ||
      (m.prescribedBy && m.prescribedBy.toLowerCase().includes(medsSearch.toLowerCase()))
  );

  const filteredLabs = labs.filter(
    (l) =>
      l.testName.toLowerCase().includes(labsSearch.toLowerCase()) ||
      l.category.toLowerCase().includes(labsSearch.toLowerCase())
  );

  if (isLoadingPatient) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (patientError || !patient) {
    return (
      <div className="flex-1 p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <Link href="/doctor/patients">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft />}>
            Back to Patients
          </Button>
        </Link>
        <Alert variant="error">
          <AlertDescription>{patientError || "Patient not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
        {/* Navigation back bar */}
        <div className="flex items-center justify-between">
          <Link href="/doctor/patients">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft />}>
              Back to Patients
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void fetchPatientInfo();
              if (activeTab === "records") void fetchRecords();
              if (activeTab === "medications") void fetchMedications();
              if (activeTab === "labs") void fetchLabs();
            }}
            leftIcon={<RefreshCw className={loadingRecords || loadingMedications || loadingLabs ? "animate-spin" : ""} />}
          >
            Refresh
          </Button>
        </div>

        {/* Patient Identity & Consent Card */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <User className="size-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {patient.displayName}
                  </h1>
                  <Badge
                    variant={
                      isConsentActive
                        ? "success"
                        : patient.connectionStatus === "PENDING_APPROVAL"
                        ? "warning"
                        : "error"
                    }
                  >
                    {isConsentActive
                      ? "ACTIVE CONSENT"
                      : patient.connectionStatus === "PENDING_APPROVAL"
                      ? "APPROVAL PENDING"
                      : isExpired
                      ? "CONSENT EXPIRED"
                      : "ACCESS LOCKED"}
                  </Badge>
                </div>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  Nexus ID: {patient.nexusId}
                </p>
              </div>
            </div>

            {/* Status Summary Pill */}
            <div className="text-xs text-muted-foreground sm:text-right">
              {isConsentActive && expiresDate && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 px-3 py-1.5 text-emerald-700 dark:text-emerald-300 font-medium">
                  <ShieldCheck className="size-3.5" />
                  Valid until {expiresDate.toLocaleDateString("en-IN")}
                </span>
              )}
            </div>
          </div>

          {/* Consent Details Banner */}
          {consent && (
            <div className="rounded-xl bg-muted/40 p-4 border border-border/60 text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Authorized Scope:</span>
                  <div className="flex flex-wrap gap-1">
                    {consent.dataScopes.map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-card px-2 py-0.5 border border-border text-[11px] font-medium text-foreground"
                      >
                        {CONSENT_DATA_SCOPE_LABELS[s] || s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>
                    Permission: <strong className="text-foreground">{consent.permission || "VIEW_ONLY"}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Purpose: <strong className="text-foreground">{consent.purpose || "DIRECT_CARE"}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Access Status & Medical Data Sections */}
        {!isConsentActive ? (
          /* Non-active consent blocked state */
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center space-y-3">
            <Lock className="size-10 text-amber-500/80 mx-auto" />
            <h3 className="text-base font-semibold text-foreground">
              {patient.connectionStatus === "PENDING_APPROVAL"
                ? "Waiting for Patient Approval"
                : isExpired
                ? "Consent Has Expired"
                : "No Active Consent Authorization"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {patient.connectionStatus === "PENDING_APPROVAL"
                ? "A consent request has been sent to the patient. Clinical records, medications, and lab reports will become visible once the patient approves the request."
                : isExpired
                ? "The authorization period granted by this patient has expired. To access updated health data, please send a new access request."
                : "Clinical health data is protected under Ayush-Life Nexus patient sovereignty policies and requires active patient consent."}
            </p>
          </div>
        ) : (
          /* Authorized Medical Data Workspace with Scope Tabs */
          <div className="space-y-6">
            {/* Tabs Header */}
            <div className="flex border-b border-border gap-2 overflow-x-auto">
              {/* Tab 1: Health Records */}
              <button
                type="button"
                onClick={() => setActiveTab("records")}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === "records"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="size-4" />
                Health Records
                {!hasRecordsScope && <Lock className="size-3 text-muted-foreground/60" />}
              </button>

              {/* Tab 2: Medications */}
              <button
                type="button"
                onClick={() => setActiveTab("medications")}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === "medications"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Pill className="size-4" />
                Medications & Prescriptions
                {!hasMedicationsScope && <Lock className="size-3 text-muted-foreground/60" />}
              </button>

              {/* Tab 3: Lab Reports */}
              <button
                type="button"
                onClick={() => setActiveTab("labs")}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === "labs"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <FlaskConical className="size-4" />
                Diagnostic Lab Reports
                {!hasLabsScope && <Lock className="size-3 text-muted-foreground/60" />}
              </button>
            </div>

            {/* TAB CONTENT: 1. Health Records */}
            {activeTab === "records" && (
              <div className="space-y-4">
                {!hasRecordsScope ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center space-y-2">
                    <Lock className="size-8 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm font-semibold text-foreground">Health Records Scope Not Granted</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      The patient did not include health documents or clinical summaries in this consent authorization.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="w-full sm:w-72">
                        <Input
                          placeholder="Search health records…"
                          value={recordsSearch}
                          onChange={(e) => setRecordsSearch(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {filteredRecords.length} Records Found
                      </span>
                    </div>

                    {loadingRecords ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredRecords.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-8 text-center space-y-2">
                        <FileText className="size-8 text-muted-foreground/30 mx-auto" />
                        <p className="text-sm font-medium text-foreground">No health records found</p>
                        <p className="text-xs text-muted-foreground">The patient has not uploaded any health documents matching your search.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredRecords.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                <FileText className="size-4" />
                              </div>
                              <Badge variant="default" className="text-[10px]">
                                {item.category}
                              </Badge>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-foreground truncate">{item.title}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.issuedDate ? new Date(item.issuedDate).toLocaleDateString("en-IN") : "Date not specified"}
                              </p>
                            </div>
                            <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                              <span>Provider: {item.providerName || "Self-uploaded"}</span>
                              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                {item.verificationStatus}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT: 2. Medications */}
            {activeTab === "medications" && (
              <div className="space-y-4">
                {!hasMedicationsScope ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center space-y-2">
                    <Lock className="size-8 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm font-semibold text-foreground">Prescription Scope Not Included</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Prescription access is not included in this patient&apos;s approved consent.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="w-full sm:w-72">
                        <Input
                          placeholder="Search medications…"
                          value={medsSearch}
                          onChange={(e) => setMedsSearch(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-medium">
                          {filteredMeds.length} Medications Found
                        </span>
                        {isConsentActive && hasMedicationsScope && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => setShowPrescribeDialog(true)}
                            leftIcon={<Plus className="size-4" />}
                          >
                            Prescribe Medication
                          </Button>
                        )}
                      </div>
                    </div>

                    {loadingMedications ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredMeds.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-8 text-center space-y-2">
                        <Pill className="size-8 text-muted-foreground/30 mx-auto" />
                        <p className="text-sm font-medium text-foreground">No medications on record</p>
                        <p className="text-xs text-muted-foreground">The patient does not have active medications listed.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredMeds.map((med) => (
                          <div
                            key={med.id}
                            className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex size-9 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
                                <Pill className="size-4" />
                              </div>
                              <Badge
                                variant={med.status === "ACTIVE" ? "success" : "default"}
                                className="text-[10px]"
                              >
                                {med.status}
                              </Badge>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-foreground truncate">{med.name}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {med.dosage} {med.dosageUnit} • {med.frequency}
                              </p>
                            </div>
                            <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                              <span>Prescribed by: {med.prescribedBy || "Doctor"}</span>
                              <span>Route: {med.route}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT: 3. Lab Reports */}
            {activeTab === "labs" && (
              <div className="space-y-4">
                {!hasLabsScope ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center space-y-2">
                    <Lock className="size-8 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm font-semibold text-foreground">Lab Reports Scope Not Granted</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      The patient did not include diagnostic lab tests or pathology reports in this consent request.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="w-full sm:w-72">
                        <Input
                          placeholder="Search lab results…"
                          value={labsSearch}
                          onChange={(e) => setLabsSearch(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {filteredLabs.length} Lab Tests Found
                      </span>
                    </div>

                    {loadingLabs ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredLabs.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-8 text-center space-y-2">
                        <FlaskConical className="size-8 text-muted-foreground/30 mx-auto" />
                        <p className="text-sm font-medium text-foreground">No lab results on record</p>
                        <p className="text-xs text-muted-foreground">The patient does not have diagnostic lab test records.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredLabs.map((lab) => (
                          <div
                            key={lab.id}
                            className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                                <FlaskConical className="size-4" />
                              </div>
                              <Badge
                                variant={
                                  lab.status === "NORMAL"
                                    ? "success"
                                    : lab.status === "CRITICAL"
                                    ? "error"
                                    : "warning"
                                }
                                className="text-[10px]"
                              >
                                {lab.status}
                              </Badge>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-foreground truncate">{lab.testName}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5 font-medium text-foreground">
                                Result: <span className="font-bold">{lab.value}</span> {lab.unit || ""}
                              </p>
                            </div>
                            <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                              <span>Lab: {lab.labName || "Diagnostic Centre"}</span>
                              <span>
                                {lab.resultDate ? new Date(lab.resultDate).toLocaleDateString("en-IN") : "Recent"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Doctor Prescription Creation Dialog (Phase 11E) */}
        <DoctorPrescriptionDialog
          isOpen={showPrescribeDialog}
          onClose={() => setShowPrescribeDialog(false)}
          patientNexusId={patient.nexusId}
          patientName={patient.displayName}
          onPrescriptionCreated={() => {
            void fetchMedications();
          }}
        />
      </div>
    </div>
  );
}
