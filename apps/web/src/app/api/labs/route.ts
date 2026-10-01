/**
 * Lab Results API — list + create.
 *
 * GET  /api/labs?status=...&category=...&search=...&sortBy=...&sortOrder=...
 * POST /api/labs  { testName, category, value, unit, status, ... }
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import { findSession, findUserById } from "@/lib/store.ts";
import { listLabResults, createLabResult } from "@/lib/labs-service.ts";
import { ok, err, fromError } from "@/lib/api-response.ts";
import {
  LabCategory,
  LabResultStatus,
  type LabFilters,
  type CreateLabResultInput,
} from "@/types/labs.ts";

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

// ─── GET /api/labs ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);

  const filters: LabFilters = {};
  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const sortBy = searchParams.get("sortBy");
  const sortOrder = searchParams.get("sortOrder");

  if (search) filters.search = search;
  if (category) filters.category = category as LabCategory;
  if (status) filters.status = status as LabResultStatus;
  if (sortBy) filters.sortBy = sortBy as "testName" | "resultDate" | "createdAt" | "status";
  if (sortOrder) filters.sortOrder = sortOrder as "asc" | "desc";

  const data = await listLabResults(auth.user.nexusId, filters);
  return ok(data);
}

// ─── POST /api/labs ───────────────────────────────────────────────────────────

const createSchema = z.object({
  testName: z.string().min(1, "Test name is required").max(200),
  category: z.nativeEnum(LabCategory),
  value: z.string().min(1, "Test value is required").max(100),
  numericValue: z.number().optional(),
  unit: z.string().max(50).optional(),
  referenceRangeMin: z.number().optional(),
  referenceRangeMax: z.number().optional(),
  referenceRangeText: z.string().max(100).optional(),
  status: z.nativeEnum(LabResultStatus),
  labName: z.string().max(200).optional(),
  collectedAt: z.string().optional(),
  resultDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
  healthRecordId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = createSchema.parse(body);

    const input: CreateLabResultInput = {
      testName: parsed.testName,
      category: parsed.category,
      value: parsed.value,
      status: parsed.status,
    };

    if (parsed.numericValue !== undefined) input.numericValue = parsed.numericValue;
    if (parsed.unit) input.unit = parsed.unit;
    if (parsed.referenceRangeMin !== undefined) input.referenceRangeMin = parsed.referenceRangeMin;
    if (parsed.referenceRangeMax !== undefined) input.referenceRangeMax = parsed.referenceRangeMax;
    if (parsed.referenceRangeText) input.referenceRangeText = parsed.referenceRangeText;
    if (parsed.labName) input.labName = parsed.labName;
    if (parsed.collectedAt) input.collectedAt = parsed.collectedAt;
    if (parsed.resultDate) input.resultDate = parsed.resultDate;
    if (parsed.notes) input.notes = parsed.notes;
    if (parsed.healthRecordId) input.healthRecordId = parsed.healthRecordId;

    const labResult = await createLabResult(auth.user.nexusId, input);
    return ok(labResult, 201);
  } catch (error) {
    if (error instanceof Error && !(error instanceof z.ZodError)) {
      return err("INVALID_REQUEST", error.message, 400);
    }
    return fromError(error);
  }
}
