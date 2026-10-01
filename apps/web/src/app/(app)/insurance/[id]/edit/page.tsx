"use client";

/**
 * Edit Insurance Policy page — /insurance/[id]/edit
 */

import * as React from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@nexus/ui";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { BreadcrumbHeader } from "@/components/layout/breadcrumb-header.tsx";
import { InsuranceForm } from "@/components/insurance/insurance-form.tsx";
import type { InsurancePolicy } from "@/types/insurance.ts";

export default function EditInsurancePage() {
  const params = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [policy, setPolicy] = React.useState<InsurancePolicy | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/insurance/${params.id}`);
        if (!res.ok) {
          const json = (await res.json()) as { error?: { message?: string } };
          throw new Error(json.error?.message ?? "Insurance policy not found");
        }
        const json = (await res.json()) as { data: InsurancePolicy };
        const raw = json.data;
        setPolicy({
          ...raw,
          createdAt: new Date(raw.createdAt),
          updatedAt: new Date(raw.updatedAt),
          expiryDate: new Date(raw.expiryDate),
          ...(raw.startDate ? { startDate: new Date(raw.startDate) } : {}),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [params.id]);

  return (
    <PageContainer maxWidth="lg">
      <BreadcrumbHeader
        segments={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Insurance", href: "/insurance" },
          { label: policy?.policyName ?? "Policy", href: `/insurance/${params.id}` },
          { label: "Edit" },
        ]}
        title={policy ? `Edit ${policy.policyName}` : "Edit Insurance Policy"}
        description="Update coverage amount, policy validity, renewal dates, or TPA details"
      />

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !error && policy && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <InsuranceForm initialData={policy} isEditing />
        </div>
      )}
    </PageContainer>
  );
}
