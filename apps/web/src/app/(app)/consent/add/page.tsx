"use client";

/**
 * Grant Consent page — /consent/add
 */

import * as React from "react";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { BreadcrumbHeader } from "@/components/layout/breadcrumb-header.tsx";
import { ConsentForm } from "@/components/consent/consent-form.tsx";

export default function AddConsentPage() {
  return (
    <PageContainer>
      <BreadcrumbHeader
        segments={[
          { label: "Consent & Privacy", href: "/consent" },
          { label: "Grant Consent" },
        ]}
      />

      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Grant Health Data Consent
          </h1>
          <p className="text-sm text-muted-foreground">
            Authorize a doctor, hospital, or insurance provider to view specific categories of your medical records.
          </p>
        </div>

        <ConsentForm />
      </div>
    </PageContainer>
  );
}
