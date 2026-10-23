# AYUSH-LIFE NEXUS

## Overview

AYUSH-Life Nexus is a digital healthcare management platform designed to unify and streamline patient health records and clinical workflows with distinct, role-separated experiences for **Patients** and **Doctors**.

The platform provides patients with complete autonomy over their personal health records, medications, lab diagnostics, insurance policies, and data access consents, while giving registered healthcare professionals secure, consent-gated access to patient health data and prescription authoring capabilities.

---

## Current MVP

The current MVP delivers comprehensive, end-to-end functionality across both Patient and Doctor portals:

### Patient Experience
- **Authentication**: Phone-based OTP authentication with session establishment, role assignment, and secure cookie handling.
- **Dashboard**: Central health summary displaying active medications, recent vitals, health record metrics, and pending consent requests.
- **Health Records**: Upload, categorize, view, and manage medical records with document metadata (prescriptions, clinical notes, discharge summaries).
- **Medications**: Manage active, completed, and discontinued medication regimens with dosage, frequency, and prescribing doctor tracking.
- **Lab Reports**: Track diagnostic test records, categorical test results, reference ranges, and diagnostic status flags.
- **Insurance**: Policy management for health coverage, policy numbers, validity periods, and insurer details.
- **Consent & Privacy**: Full patient consent management interface to view, approve, reject, and revoke data access requests initiated by healthcare professionals.
- **Activity / Audit Log**: Detailed chronological audit trail of all patient account activities, record views, and consent status transitions.
- **Settings**: Patient profile management, appearance theme toggles (light/dark mode), and account security settings.
- **Help & Support**: User guidance and help resources for navigating the portal.

### Doctor Experience
- **Doctor Registration**: Registration workflow capturing doctor credentials, medical registration number, specialty, qualifications, and clinic/hospital affiliation.
- **Doctor Profile**: Profile viewing and management for practicing clinicians.
- **Patient Nexus ID Lookup**: Discovery mechanism allowing doctors to search for registered patients via their unique Nexus ID.
- **Consent Requests**: Ability to request time-bound, scoped data access permissions (records, medications, lab reports) from patients.
- **Consent-Gated Patient Data Access**: Strict server-enforced access gate preventing doctors from viewing any patient records unless active, approved consent exists.
- **Read-Only Patient Records**: Secure viewing of patient clinical records subject to granted consent scopes.
- **Read-Only Medications**: Inspection of current and past patient medication histories.
- **Read-Only Lab Reports**: Diagnostic panel and lab report review within granted scope.
- **Prescription Creation**: Clinical workflow enabling doctors to issue structured prescriptions for consented patients.
- **Doctor Activity / Audit Log**: Dedicated clinical audit trail capturing access events, consent actions, and prescription issuances.

---

## Security

The platform enforces a multi-layered security architecture:

- **OTP Authentication**: Phone-based verification flow establishing authenticated user sessions.
- **JWT / Session Management**: Signed HTTP-only session cookies with cryptographic verification (`jose`) and configurable session expiration.
- **Role Separation**: Strict separation between `PATIENT`, `DOCTOR`, and administrative roles across all routes and API endpoints.
- **Server-Side Authorization**: Defense-in-depth authorization checks enforced in Next.js middleware and validated independently within API route handlers.
- **Consent-Gated Doctor Access**: Centralized access evaluation ensuring doctors cannot retrieve patient records, medications, or lab data without valid patient consent.
- **Time-Bound Consent**: Consent grants enforce explicit expiration windows, after which data access automatically lapses.
- **Scope-Based Access**: Granular permissions defining specific access boundaries (e.g., records, medications, labs) for each consent request.
- **Activity & Audit Logging**: Immutable activity logs tracking authentication, profile updates, consent decisions, and clinical data access.

---

## ABHA / ABDM STATUS

> **IMPORTANT NOTICE:**  
> **ABHA/ABDM integration is NOT currently implemented.**

The current MVP must **NOT** be described as having real ABHA verification or live ABDM integration. Official ABHA/ABDM integration is planned as a future development phase.

The current system does **NOT** feature:
- Government verification
- Live ABDM integration
- Real ABHA authentication
- ABDM health-record exchange (M1/M2/M3 milestones)
- Government certification

All current workflows operate independently within the internal Nexus identity and consent framework.

---

## Current Data Storage

The current MVP utilizes an in-process, development-oriented in-memory data store (`apps/web/src/lib/store.ts`).

- **Non-Persistent**: Data is maintained in application memory during runtime and resets upon process restart.
- **Not Production-Ready**: The system is **NOT** yet configured with a persistent, production-grade healthcare database (such as PostgreSQL with encryption at rest).
- **Interface-Ready**: The data store architecture isolates data operations behind clean interfaces, facilitating a seamless migration to persistent storage and distributed caching (e.g., Redis / relational DB) in future phases.

---

## Technology Stack

The project is structured as a modern TypeScript monorepo using pnpm workspaces:

- **Framework**: [Next.js](https://nextjs.org/) (v15.0+ / App Router)
- **UI Library**: [React](https://react.dev/) 19
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with Tailwind Merge and PostCSS
- **Component Primitives**: [Radix UI](https://www.radix-ui.com/) (Dialog, Dropdown, Tabs, Avatar, Tooltip, Switch, Select, Scroll Area, Toast)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) resolvers
- **Data Visualization**: [Recharts](https://recharts.org/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Security & Cryptography**: [jose](https://github.com/panva/jose) (JWT verification and signing)
- **Date Handling**: [date-fns](https://date-fns.org/)
- **Package Manager**: [pnpm](https://pnpm.io/) (v9+) with Monorepo Workspaces

---

## Project Structure

```
ayush-nexus/
├── apps/
│   ├── web/                     # Primary Next.js 15 application (Patient & Doctor portals + APIs)
│   │   ├── src/
│   │   │   ├── app/             # App Router pages and API routes
│   │   │   │   ├── (patient)    # Patient views (dashboard, records, meds, labs, consent, settings)
│   │   │   │   ├── doctor/      # Doctor portal views (dashboard, patients, consent, profile)
│   │   │   │   ├── auth/        # Authentication views (login, OTP verification, doctor registration)
│   │   │   │   └── api/         # Next.js API route handlers
│   │   │   ├── components/      # UI components (patient, doctor, records, meds, labs, layout)
│   │   │   ├── config/          # Navigation and app configurations
│   │   │   ├── contexts/        # React contexts (AuthContext)
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── lib/             # Core utilities, services, session management, and store
│   │   │   ├── store/           # Zustand client stores
│   │   │   ├── styles/          # Global styles and Tailwind configuration
│   │   │   └── types/           # App-level TypeScript types
│   │   └── package.json
│   └── api/                     # Backend API workspace package
│       └── package.json
├── packages/
│   ├── design-tokens/           # Shared design tokens (colors, typography, spacing, radius)
│   ├── types/                   # Shared TypeScript domain types
│   ├── ui/                      # Shared reusable UI component library
│   └── utils/                   # Shared helper utilities
├── .env.example                 # Environment configuration template
├── package.json                 # Monorepo root package definition
├── pnpm-lock.yaml               # Locked dependency tree
├── pnpm-workspace.yaml          # Monorepo workspace configuration
└── tsconfig.base.json           # Base TypeScript configuration
```

---

## Local Development

### Prerequisites
- **Node.js**: `>= 20.0.0`
- **pnpm**: `>= 9.0.0`

### Setup Instructions

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure Environment Variables**:
   Copy the example environment file:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```
   Generate a secure 64-byte hex secret for `JWT_SECRET`:
   ```bash
   # On Linux / macOS / Git Bash:
   openssl rand -hex 64

   # On Windows PowerShell:
   -join ((1..64) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })
   ```
   Set the generated value in `apps/web/.env.local`:
   ```env
   JWT_SECRET=your_generated_64_byte_hex_secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

3. **Run the Development Server**:
   ```bash
   pnpm dev
   ```

4. **Access the Application**:
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Development OTP Behavior
In development mode (`NODE_ENV=development`), the OTP generation endpoint returns the generated OTP code directly in the API response (`_devOtp`) to facilitate rapid local testing without external SMS gateway dependencies.

> **CRITICAL**: The development OTP bypass mechanism exists strictly for local development and unit testing. It must **NEVER** be treated as a production authentication mechanism or enabled in production environments.

### SMS OTP Delivery

Both patient sign-in and doctor registration send the generated OTP through MSG91 Flow API when `MSG91_AUTH_KEY` and `MSG91_OTP_TEMPLATE_ID` are configured in `apps/web/.env.local`. The MSG91 template must be approved for the account and use `VAR1` as the OTP placeholder. Indian mobile numbers are sent with the `91` country code.

In local development, SMS delivery is skipped when these variables are not configured; the development OTP remains available for testing. In production, both variables are required, and the OTP is invalidated if MSG91 cannot accept the message.

---

## Verification & Build Commands

- **Typecheck Workspaces**:
  ```bash
  pnpm -r typecheck
  ```
- **Production Build**:
  ```bash
  pnpm -r build
  ```

---

## Future Roadmap

- **Persistent Production Database**: Transition from the in-memory store to PostgreSQL / Prisma with encryption at rest.
- **ABHA / ABDM Integration**: Official integration with Ayushman Bharat Digital Mission (ABDM) APIs (ABHA creation, verification, and M1/M2/M3 health information exchange).
- **FHIR R4 Standardization**: Alignment of clinical records and health data models with FHIR R4 specifications.
- **Production Deployment & CI/CD**: Cloud containerization and automated CI/CD deployment pipelines.
- **Audit Hardening**: Integration with tamper-evident audit storage and compliance reporting.
