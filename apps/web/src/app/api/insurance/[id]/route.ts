/**
 * Insurance API — single insurance policy operations.
 *
 * GET    /api/insurance/[id]   — fetch single policy
 * PATCH  /api/insurance/[id]   — update policy
 * DELETE /api/insurance/[id]   — soft delete policy
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import { findSession, findUserById } from "@/lib/store.ts";
import {
  getInsurancePolicy,
  updateInsurancePolicy,
  deleteInsurancePolicy,
} from "@/lib/insurance-service.ts";
import { ok, err, fromError } from "@/lib/api-response.ts";
import {
  InsurancePolicyType,
  InsurancePolicyStatus,
  type UpdateInsuranceInput,
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

// ─── GET /api/insurance/[id] ──────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const policy = await getInsurancePolicy(id, auth.user.nexusId);
  if (!policy) return err("NOT_FOUND", "Insurance policy not found", 404);

  return ok(policy);
}

// ─── PATCH /api/insurance/[id] ────────────────────────────────────────────────

const updateSchema = z.object({
  policyNumber: z.string().min(1).max(100).optional(),
  providerName: z.string().min(1).max(200).optional(),
  policyName: z.string().min(1).max(200).optional(),
  policyType: z.nativeEnum(InsurancePolicyType).optional(),
  sumInsured: z.coerce.number().positive().optional(),
  premiumAmount: z.coerce.number().nonnegative().optional().nullable(),
  startDate: z.string().optional().nullable(),
  expiryDate: z.string().optional(),
  status: z.nativeEnum(InsurancePolicyStatus).optional(),
  tpaName: z.string().max(200).optional().nullable(),
  tpaContact: z.string().max(100).optional().nullable(),
  networkHospitalUrl: z.string().max(500).optional().nullable(),
  policyDocumentRecordId: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    const input: UpdateInsuranceInput = {};
    if (parsed.policyNumber !== undefined) input.policyNumber = parsed.policyNumber;
    if (parsed.providerName !== undefined) input.providerName = parsed.providerName;
    if (parsed.policyName !== undefined) input.policyName = parsed.policyName;
    if (parsed.policyType !== undefined) input.policyType = parsed.policyType;
    if (parsed.sumInsured !== undefined) input.sumInsured = parsed.sumInsured;
    if (parsed.premiumAmount !== undefined) {
      input.premiumAmount = parsed.premiumAmount === null ? undefined : parsed.premiumAmount;
    }
    if (parsed.startDate !== undefined) input.startDate = parsed.startDate || undefined;
    if (parsed.expiryDate !== undefined) input.expiryDate = parsed.expiryDate;
    if (parsed.status !== undefined) input.status = parsed.status;
    if (parsed.tpaName !== undefined) input.tpaName = parsed.tpaName || undefined;
    if (parsed.tpaContact !== undefined) input.tpaContact = parsed.tpaContact || undefined;
    if (parsed.networkHospitalUrl !== undefined) {
      input.networkHospitalUrl = parsed.networkHospitalUrl || undefined;
    }
    if (parsed.policyDocumentRecordId !== undefined) {
      input.policyDocumentRecordId = parsed.policyDocumentRecordId || undefined;
    }
    if (parsed.notes !== undefined) input.notes = parsed.notes || undefined;

    const policy = await updateInsurancePolicy(id, auth.user.nexusId, input);
    if (!policy) return err("NOT_FOUND", "Insurance policy not found or not owned by you", 404);

    return ok(policy);
  } catch (error) {
    if (error instanceof Error && !(error instanceof z.ZodError)) {
      return err("INVALID_REQUEST", error.message, 400);
    }
    return fromError(error);
  }
}

// ─── DELETE /api/insurance/[id] ───────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const deleted = await deleteInsurancePolicy(id, auth.user.nexusId);
  if (!deleted) return err("NOT_FOUND", "Insurance policy not found or not owned by you", 404);

  return ok({ deleted: true });
}
