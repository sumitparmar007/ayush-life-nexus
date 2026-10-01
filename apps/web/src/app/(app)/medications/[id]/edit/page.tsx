"use client";

/**
 * Edit Medication page — /medications/[id]/edit
 */

import * as React from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@nexus/ui";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { BreadcrumbHeader } from "@/components/layout/breadcrumb-header.tsx";
import { MedicationForm } from "@/components/medications/medication-form.tsx";
import type { Medication } from "@/types/medications.ts";

export default function EditMedicationPage() {
  const params = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [medication, setMedication] = React.useState<Medication | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/medications/${params.id}`);
        if (!res.ok) {
          const json = (await res.json()) as { error?: { message?: string } };
          throw new Error(json.error?.message ?? "Medication not found");
        }
        const json = (await res.json()) as { data: Medication };
        const raw = json.data;
        setMedication({
          ...raw,
          createdAt: new Date(raw.createdAt),
          updatedAt: new Date(raw.updatedAt),
          ...(raw.startDate ? { startDate: new Date(raw.startDate) } : {}),
          ...(raw.endDate ? { endDate: new Date(raw.endDate) } : {}),
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
          { label: "Medications", href: "/medications" },
          { label: medication?.name ?? "Medication", href: `/medications/${params.id}` },
          { label: "Edit" },
        ]}
        title={medication ? `Edit ${medication.name}` : "Edit Medication"}
        description="Update dosage, schedule, instructions, or status"
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

      {!isLoading && !error && medication && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <MedicationForm initialData={medication} isEditing />
        </div>
      )}
    </PageContainer>
  );
}
