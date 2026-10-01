"use client";

/**
 * Settings & Account Management Page — /settings
 *
 * Provides personal profile management, appearance customisation,
 * data sovereignty links, and active session controls.
 */

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { User, Palette, Lock, ShieldCheck, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@nexus/ui";
import { cn } from "@nexus/utils";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { BreadcrumbHeader } from "@/components/layout/breadcrumb-header.tsx";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form.tsx";
import { AppearanceSettings } from "@/components/settings/appearance-settings.tsx";
import { PrivacyDataSettings } from "@/components/settings/privacy-data-settings.tsx";
import { SecuritySessionCard } from "@/components/settings/security-session-card.tsx";
import { useSettings } from "@/hooks/use-settings.ts";

type SettingsTab = "profile" | "appearance" | "privacy" | "security";

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile & Identity", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "privacy", label: "Privacy & Data", icon: Lock },
  { id: "security", label: "Security & Sessions", icon: ShieldCheck },
];

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as SettingsTab) || "profile";
  const [activeTab, setActiveTab] = React.useState<SettingsTab>(
    ["profile", "appearance", "privacy", "security"].includes(initialTab)
      ? initialTab
      : "profile"
  );

  const { isLoading, settings, error, updateSettings, refresh } = useSettings();

  return (
    <PageContainer maxWidth="2xl">
      <BreadcrumbHeader
        segments={[{ label: "Settings" }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            leftIcon={<RefreshCw className={isLoading ? "animate-spin" : ""} />}
          >
            Refresh
          </Button>
        }
      />

      <div className="flex flex-col gap-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Settings & Account Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your patient profile, interface appearance, privacy controls, and security session.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 pb-3">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
            <p className="text-sm font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={refresh} className="mt-3">
              Try again
            </Button>
          </div>
        ) : isLoading || !settings ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div>
            {activeTab === "profile" && (
              <ProfileSettingsForm
                settings={settings}
                onUpdate={updateSettings}
              />
            )}

            {activeTab === "appearance" && <AppearanceSettings />}

            {activeTab === "privacy" && <PrivacyDataSettings />}

            {activeTab === "security" && (
              <SecuritySessionCard settings={settings} />
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
