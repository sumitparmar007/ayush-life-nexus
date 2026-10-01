"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@nexus/ui";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { BreadcrumbHeader } from "@/components/layout/breadcrumb-header.tsx";
import { WelcomeHeader } from "@/components/dashboard/welcome-header.tsx";
import { UserProfileSummaryCard } from "@/components/dashboard/user-profile-card.tsx";
import { QuickActionsPanel } from "@/components/dashboard/quick-actions-panel.tsx";
import { HealthScoreCard } from "@/components/dashboard/health-score-card.tsx";
import {
  MedicalRecordsWidget,
  InsuranceWidget,
  ConsentWidget,
  LabsWidget,
  MedicationsWidget,
} from "@/components/dashboard/summary-widgets.tsx";
import { ActivityFeed, UpcomingTasks } from "@/components/dashboard/activity-tasks.tsx";
import { NotificationsWidget } from "@/components/dashboard/notifications-widget.tsx";
import { useDashboard } from "@/hooks/use-dashboard.ts";
import { useAuth } from "@/contexts/auth-context.tsx";
import type { WidgetStatus } from "@/types/dashboard.ts";

export default function DashboardPage() {
  const { isLoading, data, error, refresh } = useDashboard();
  const { session } = useAuth();

  const ws = (hasData: boolean): WidgetStatus => {
    if (isLoading) return "loading";
    if (error) return "error";
    if (!hasData) return "empty";
    return "success";
  };

  return (
    <PageContainer maxWidth="2xl">
      <BreadcrumbHeader
        segments={[{ label: "Dashboard" }]}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            leftIcon={<RefreshCw />}
            isLoading={isLoading}
            aria-label="Refresh dashboard"
          >
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        }
      />

      {data ? (
        <WelcomeHeader profile={data.profile} />
      ) : (
        <div className="h-16 rounded-2xl bg-muted animate-pulse" aria-hidden="true" />
      )}

      <QuickActionsPanel />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-4">
          <HealthScoreCard
            data={data?.healthScore ?? null}
            status={ws(Boolean(data?.healthScore))}
            onRetry={refresh}
          />
          {data ? (
            <UserProfileSummaryCard
              profile={data.profile}
              trustLevel={session.trustLevel}
            />
          ) : (
            <div className="h-48 rounded-2xl bg-muted animate-pulse" aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <MedicalRecordsWidget data={data?.medicalRecords ?? null} status={ws(Boolean(data?.medicalRecords))} onRetry={refresh} />
          <LabsWidget data={data?.labs ?? null} status={ws(Boolean(data?.labs))} onRetry={refresh} />
        </div>

        <div className="flex flex-col gap-4">
          <InsuranceWidget data={data?.insurance ?? null} status={ws(Boolean(data?.insurance))} onRetry={refresh} />
          <MedicationsWidget data={data?.medications ?? null} status={ws(Boolean(data?.medications))} onRetry={refresh} />
          <ConsentWidget data={data?.consent ?? null} status={ws(Boolean(data?.consent))} onRetry={refresh} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <UpcomingTasks
          tasks={data?.upcomingTasks ?? []}
          status={ws(Boolean(data?.upcomingTasks))}
          onRetry={refresh}
        />
        <div className="flex flex-col gap-4">
          <ActivityFeed
            items={data?.recentActivity ?? []}
            status={ws(Boolean(data?.recentActivity))}
            onRetry={refresh}
          />
          <NotificationsWidget
            items={(data?.recentActivity ?? []).filter((a) => !a.isRead)}
            status={ws(Boolean(data?.recentActivity))}
            onRetry={refresh}
          />
        </div>
      </div>
    </PageContainer>
  );
}
