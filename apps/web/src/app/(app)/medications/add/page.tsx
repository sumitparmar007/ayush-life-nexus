"use client";

/**
 * Add Medication page — /medications/add
 */

import * as React from "react";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { BreadcrumbHeader } from "@/components/layout/breadcrumb-header.tsx";
import { MedicationForm } from "@/components/medications/medication-form.tsx";

export default function AddMedicationPage() {
  return (
    <PageContainer maxWidth="lg">
      <BreadcrumbHeader
        segments={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Medications", href: "/medications" },
          { label: "Add Medication" },
        ]}
        title="Add Medication"
        description="Record a new medication, dosage, and dosing schedule"
      />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <MedicationForm />
      </div>
    </PageContainer>
  );
}
