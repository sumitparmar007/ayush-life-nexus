"use client";

/**
 * Add Insurance Policy page — /insurance/add
 */

import * as React from "react";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { BreadcrumbHeader } from "@/components/layout/breadcrumb-header.tsx";
import { InsuranceForm } from "@/components/insurance/insurance-form.tsx";

export default function AddInsurancePage() {
  return (
    <PageContainer>
      <BreadcrumbHeader
        segments={[
          { label: "Insurance", href: "/insurance" },
          { label: "Add Policy" },
        ]}
      />

      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Add Insurance Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your health insurance policy details, sum insured, renewal dates, and TPA helpline contacts.
          </p>
        </div>

        <InsuranceForm />
      </div>
    </PageContainer>
  );
}
