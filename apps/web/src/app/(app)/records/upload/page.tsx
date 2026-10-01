"use client";

/**
 * Upload Record page — /records/upload
 */

import * as React from "react";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { BreadcrumbHeader } from "@/components/layout/breadcrumb-header.tsx";
import { RecordUploadForm } from "@/components/records/record-upload-form.tsx";

export default function UploadRecordPage() {
  return (
    <PageContainer maxWidth="lg">
      <BreadcrumbHeader
        segments={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Health Records", href: "/records" },
          { label: "Upload" },
        ]}
        title="Upload Health Record"
        description="Add a new medical document to your health records"
      />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <RecordUploadForm />
      </div>
    </PageContainer>
  );
}
