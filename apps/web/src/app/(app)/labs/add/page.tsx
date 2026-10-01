"use client";

/**
 * Add Lab Result page — /labs/add
 */

import * as React from "react";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { BreadcrumbHeader } from "@/components/layout/breadcrumb-header.tsx";
import { LabForm } from "@/components/labs/lab-form.tsx";

export default function AddLabResultPage() {
  return (
    <PageContainer>
      <BreadcrumbHeader
        segments={[
          { label: "Lab Results", href: "/labs" },
          { label: "Record Lab Test" },
        ]}
      />

      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Record Lab Result
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter test parameters, biomarker values, reference ranges, and diagnostic center details.
          </p>
        </div>

        <LabForm />
      </div>
    </PageContainer>
  );
}
