"use client";

/**
 * Edit Consent page — /consent/[id]/edit
 */

import * as React from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@nexus/ui";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { BreadcrumbHeader } from "@/components/layout/breadcrumb-header.tsx";
import { ConsentForm } from "@/components/consent/consent-form.tsx";
import type { ConsentRecord } from "@/types/consent.ts";

export default function EditConsentPage() {
  const params = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [consent, setConsent] = React.useState<ConsentRecord | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/consent/${params.id}`);
        if (!res.ok) {
          const json = (await res.json()) as { error?: { message?: string } };
          throw new Error(json.error?.message ?? "Consent record not found");
        }
        const json = (await res.json()) as { data: ConsentRecord };
        const raw = json.data;
        setConsent({
          ...raw,
          createdAt: new Date(raw.createdAt),
          updatedAt: new Date(raw.updatedAt),
          expiresAt: new Date(raw.expiresAt),
          ...(raw.grantedAt ? { grantedAt: new Date(raw.grantedAt) } : {}),
          ...(raw.revokedAt ? { revokedAt: new Date(raw.revokedAt) } : {}),
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
          { label: "Consent & Privacy", href: "/consent" },
          { label: consent?.recipientName ?? "Consent", href: `/consent/${params.id}` },
          { label: "Edit" },
        ]}
        title={consent ? `Edit ${consent.recipientName}` : "Edit Consent"}
        description="Update data access categories, permissions, or expiration dates"
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

      {!isLoading && !error && consent && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <ConsentForm initialData={consent} isEditing />
        </div>
      )}
    </PageContainer>
  );
}
