import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { issueOtp } from "@/lib/store.ts";
import { fromError } from "@/lib/api-response.ts";

const schema = z.object({
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const { phone } = schema.parse(body);
    const issuance = issueOtp(phone);
    return NextResponse.json({
      success: true,
      message: "OTP sent",
      data: issuance,
      ...(process.env.NODE_ENV === "development" && issuance._devOtp ? { otp: issuance._devOtp } : {}),
    }, { status: 200 });
  } catch (error) {
    return fromError(error);
  }
}
