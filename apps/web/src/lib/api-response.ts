import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function err(code: string, message: string, status: number): NextResponse {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

export function fromError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return err("VALIDATION_ERROR", "Invalid request body", 400);
  }
  console.error("[API]", error);
  return err("INTERNAL_ERROR", "An internal error occurred", 500);
}
