import Link from "next/link";
import { ArrowLeft, HelpCircle, Phone, Shield } from "lucide-react";
import { AuthCard, AuthLogo, AuthHeading } from "@/components/auth/auth-card.tsx";

const options = [
  {
    icon: Phone,
    title: "Changed your number?",
    body: "Contact our support team with proof of identity to transfer your account.",
    action: null,
  },
  {
    icon: Shield,
    title: "Have an ABHA ID?",
    body: "You can sign in with your ABHA address and OTP instead of phone.",
    action: { label: "Sign in with ABHA", href: "/auth/login?mode=abha" },
  },
  {
    icon: HelpCircle,
    title: "Still need help?",
    body: "Our support team is available 9 AM – 6 PM IST, Monday to Saturday.",
    action: { label: "Contact support", href: "mailto:support@ayushnexus.in" },
  },
] as const;

export default function ForgotPage() {
  return (
    <AuthCard>
      <AuthLogo />
      <AuthHeading title="Can't sign in?" description="Here are a few options that might help." />
      <div className="flex flex-col gap-3">
        {options.map(({ icon: Icon, title, body, action }) => (
          <div key={title} className="rounded-xl border border-border p-4 flex gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{body}</p>
              {action && (
                <Link href={action.href} className="mt-1 text-xs font-medium text-primary hover:underline underline-offset-2">
                  {action.label} →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
      <Link href="/auth/login" className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-3.5" />
        Back to sign in
      </Link>
    </AuthCard>
  );
}
