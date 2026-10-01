"use client";

/**
 * Lab Result Detail page — /labs/[id]
 */

import * as React from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@nexus/ui";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { BreadcrumbHeader } from "@/components/layout/breadcrumb-header.tsx";
import { LabDetailView } from "@/components/labs/lab-detail-view.tsx";
import type { LabResult } from "@/types/labs.ts";

export default function LabDetailPage() {
  const params = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [lab, setLab] = React.useState<LabResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/labs/${params.id}`);
        if (!res.ok) {
          const json = (await res.json()) as { error?: { message?: string } };
          throw new Error(json.error?.message ?? "Lab result not found");
        }
        const json = (await res.json()) as { data: LabResult };
        const raw = json.data;
        setLab({
          ...raw,
          createdAt: new Date(raw.createdAt),
          updatedAt: new Date(raw.updatedAt),
          ...(raw.collectedAt ? { collectedAt: new Date(raw.collectedAt) } : {}),
          ...(raw.resultDate ? { resultDate: new Date(raw.resultDate) } : {}),
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
    <PageContainer maxWidth="2xl">
      <BreadcrumbHeader
        segments={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Lab Results", href: "/labs" },
          { label: lab?.testName ?? "Lab Result" },
        ]}
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

      {!isLoading && !error && lab && (
        <LabDetailView lab={lab} />
      )}
    </PageContainer>
  );
}
