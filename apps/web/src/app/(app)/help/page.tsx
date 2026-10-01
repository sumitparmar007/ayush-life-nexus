import * as React from "react";
import Link from "next/link";
import {
  HelpCircle,
  FileText,
  Pill,
  FlaskConical,
  Shield,
  ShieldCheck,
  User,
  LogOut,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@nexus/ui";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { BreadcrumbHeader } from "@/components/layout/breadcrumb-header.tsx";

interface FaqItem {
  question: string;
  answer: string;
  icon: React.ElementType;
  actionHref?: string;
  actionLabel?: string;
}

const FAQS: FaqItem[] = [
  {
    question: "How do I add a health record?",
    answer:
      "Navigate to Health Records and click 'Upload Document'. Select your medical PDF or image (prescription, lab report, discharge summary, vaccination, or doctor note), enter record metadata, and submit.",
    icon: FileText,
    actionHref: "/records/upload",
    actionLabel: "Upload Record",
  },
  {
    question: "How do I add a medication?",
    answer:
      "Open the Medications section and click 'Add Medication'. Fill in the medication name, dosage, frequency, and route. You can also link the medication to an existing uploaded prescription record.",
    icon: Pill,
    actionHref: "/medications/add",
    actionLabel: "Add Medication",
  },
  {
    question: "How do I record a lab result?",
    answer:
      "Go to Lab Results and click 'Add Lab Test'. Specify the test name, category (e.g. Biochemistry, Hematology), measured value, unit, and reference ranges. The system automatically calculates normal or abnormal status.",
    icon: FlaskConical,
    actionHref: "/labs/add",
    actionLabel: "Record Lab Test",
  },
  {
    question: "How do I add insurance information?",
    answer:
      "Visit Insurance and click 'Add Policy'. Enter your policy number, provider name, policy type, total sum insured in INR, and expiry date to track coverage totals and renewal countdowns.",
    icon: Shield,
    actionHref: "/insurance/add",
    actionLabel: "Add Insurance Policy",
  },
  {
    question: "How does Consent & Privacy work?",
    answer:
      "In Consent & Privacy, you can grant granular data access permissions to healthcare providers or insurance TPAs. You define specific data scopes (e.g. lab reports or prescriptions) and expiry dates, and you can revoke access at any time.",
    icon: ShieldCheck,
    actionHref: "/consent",
    actionLabel: "Manage Consents",
  },
  {
    question: "How do I update my profile?",
    answer:
      "Navigate to Settings and select the 'Profile & Identity' tab. Here you can edit your display name, optional email address, and ABHA ID number.",
    icon: User,
    actionHref: "/settings?tab=profile",
    actionLabel: "Edit Profile",
  },
  {
    question: "How do I sign out?",
    answer:
      "You can sign out anytime by opening the User Menu in the top right header or going to Settings > Security & Sessions, and clicking 'Sign Out'.",
    icon: LogOut,
    actionHref: "/settings?tab=security",
    actionLabel: "Security & Sessions",
  },
];

export default function HelpPage() {
  return (
    <PageContainer maxWidth="2xl">
      <BreadcrumbHeader segments={[{ label: "Help & Support" }]} />

      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HelpCircle className="size-6 text-primary" />
            Help & Support
          </h1>
          <p className="text-sm text-muted-foreground">
            Frequently asked questions, system guides, and assistance for Ayush-Life Nexus.
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Frequently Asked Questions
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {FAQS.map((faq) => {
              const Icon = faq.icon;
              return (
                <div
                  key={faq.question}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-4.5" />
                    </span>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-semibold text-foreground">
                        {faq.question}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>

                  {faq.actionHref && (
                    <div className="mt-4 flex justify-end pt-2 border-t border-border/40">
                      <Link href={faq.actionHref}>
                        <Button
                          variant="ghost"
                          size="sm"
                          rightIcon={<ArrowRight className="size-3.5" />}
                        >
                          {faq.actionLabel}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Support & Assistance Card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Info className="size-4 text-primary" />
            Technical Support & Inquiries
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            For support with this MVP evaluation release, please contact the project administrator or development team.
          </p>
          <div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground block mb-0.5">Ayush-Life Nexus MVP</span>
            <span>Version 0.1.0 • Client-Driven Health Intelligence Network</span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
