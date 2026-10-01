/**
 * Health Records API — list + create.
 *
 * GET  /api/records?category=...&search=...&sortBy=...&sortOrder=...
 * POST /api/records  { title, category, ... }
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import { findSession, findUserById } from "@/lib/store.ts";
import { listRecords, createRecord } from "@/lib/health-records-service.ts";
import { ok, err, fromError } from "@/lib/api-response.ts";
import { RecordCategory } from "@/types/health-records.ts";

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

// ─── GET /api/records ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);

  const filters: import("@/types/health-records.ts").HealthRecordFilters = {};
  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const sortBy = searchParams.get("sortBy");
  const sortOrder = searchParams.get("sortOrder");
  if (search) filters.search = search;
  if (category) filters.category = category as typeof RecordCategory[keyof typeof RecordCategory];
  if (sortBy) filters.sortBy = sortBy as "createdAt" | "issuedDate" | "title";
  if (sortOrder) filters.sortOrder = sortOrder as "asc" | "desc";

  const data = await listRecords(auth.user.nexusId, filters);
  return ok(data);
}

// ─── POST /api/records ────────────────────────────────────────────────────────

const createSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  category: z.nativeEnum(RecordCategory),
  notes: z.string().max(1000).optional(),
  issuedDate: z.string().optional(),
  providerName: z.string().max(200).optional(),
  fileName: z.string().min(1, "File name is required"),
  fileMimeType: z.string().min(1),
  fileSizeBytes: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = createSchema.parse(body);

    const input: import("@/types/health-records.ts").CreateHealthRecordInput = {
      title: parsed.title,
      category: parsed.category,
      fileName: parsed.fileName,
      fileMimeType: parsed.fileMimeType,
      fileSizeBytes: parsed.fileSizeBytes,
    };
    if (parsed.notes) input.notes = parsed.notes;
    if (parsed.issuedDate) input.issuedDate = parsed.issuedDate;
    if (parsed.providerName) input.providerName = parsed.providerName;

    const record = await createRecord(auth.user.nexusId, input);
    return ok(record, 201);
  } catch (error) {
    return fromError(error);
  }
}
