/**
 * Insurance API — list + create.
 *
 * GET  /api/insurance?status=...&type=...&search=...&sortBy=...&sortOrder=...
 * POST /api/insurance  { policyNumber, providerName, policyName, policyType, sumInsured, expiryDate, status, ... }
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import { findSession, findUserById } from "@/lib/store.ts";
import {
  listInsurancePolicies,
  createInsurancePolicy,
} from "@/lib/insurance-service.ts";
import { ok, err, fromError } from "@/lib/api-response.ts";
import {
  InsurancePolicyType,
  InsurancePolicyStatus,
  type InsuranceFilters,
  type CreateInsuranceInput,
} from "@/types/insurance.ts";

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function authenticateRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return { error: err("UNAUTHORIZED", "No session", 401) };

  const sessionId = await verifySessionJwt(token);
  if (!sessionId) return { error: err("INVALID_TOKEN", "Invalid token", 401) };

  const session = findSession(sessionId);
  if (!session) return { error: err("SESSION_NOT_FOUND", "Session expired", 401) };

  const user = findUserById(session.nexusId);
  if (!user) return { error: err("USER_NOT_FOUND", "User not found", 401) };

  return { user };
}

// ─── GET /api/insurance ───────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);

  const filters: InsuranceFilters = {};
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const sortBy = searchParams.get("sortBy");
  const sortOrder = searchParams.get("sortOrder");

  if (search) filters.search = search;
  if (status) filters.status = status as InsurancePolicyStatus;
  if (type) filters.type = type as InsurancePolicyType;
  if (sortBy) filters.sortBy = sortBy as "providerName" | "sumInsured" | "expiryDate" | "createdAt";
  if (sortOrder) filters.sortOrder = sortOrder as "asc" | "desc";

  const data = await listInsurancePolicies(auth.user.nexusId, filters);
  return ok(data);
}

// ─── POST /api/insurance ──────────────────────────────────────────────────────

const createSchema = z.object({
  policyNumber: z.string().min(1, "Policy number is required").max(100),
  providerName: z.string().min(1, "Insurance provider name is required").max(200),
  policyName: z.string().min(1, "Policy plan name is required").max(200),
  policyType: z.nativeEnum(InsurancePolicyType),
  sumInsured: z.coerce.number().positive("Sum insured must be a positive amount"),
  premiumAmount: z.coerce.number().nonnegative().optional(),
  startDate: z.string().optional(),
  expiryDate: z.string().min(1, "Expiry date is required"),
  status: z.nativeEnum(InsurancePolicyStatus),
  tpaName: z.string().max(200).optional(),
  tpaContact: z.string().max(100).optional(),
  networkHospitalUrl: z.string().max(500).optional(),
  policyDocumentRecordId: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = createSchema.parse(body);

    const input: CreateInsuranceInput = {
      policyNumber: parsed.policyNumber,
      providerName: parsed.providerName,
      policyName: parsed.policyName,
      policyType: parsed.policyType,
      sumInsured: parsed.sumInsured,
      expiryDate: parsed.expiryDate,
      status: parsed.status,
    };

    if (parsed.premiumAmount !== undefined) input.premiumAmount = parsed.premiumAmount;
    if (parsed.startDate) input.startDate = parsed.startDate;
    if (parsed.tpaName) input.tpaName = parsed.tpaName;
    if (parsed.tpaContact) input.tpaContact = parsed.tpaContact;
    if (parsed.networkHospitalUrl) input.networkHospitalUrl = parsed.networkHospitalUrl;
    if (parsed.policyDocumentRecordId) input.policyDocumentRecordId = parsed.policyDocumentRecordId;
    if (parsed.notes) input.notes = parsed.notes;

    const policy = await createInsurancePolicy(auth.user.nexusId, input);
    return ok(policy, 201);
  } catch (error) {
    if (error instanceof Error && !(error instanceof z.ZodError)) {
      return err("INVALID_REQUEST", error.message, 400);
    }
    return fromError(error);
  }
}
