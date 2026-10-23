/**
 * Doctor Registration API
 *
 * POST /api/doctor/register
 *
 * Step 1: Collects doctor info + phone.
 * Step 2: Issues OTP via existing OTP infrastructure.
 *
 * The actual user+profile creation happens in /api/doctor/register/verify
 * after OTP confirmation — not here.
 *
 * This endpoint only validates the phone is available and sends OTP.
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPhone, findUserByPhone, issueOtp, discardOtp } from "@/lib/store.ts";
import { err, fromError } from "@/lib/api-response.ts";
import { sendOtpSms, SmsDeliveryError } from "@/lib/sms-service.ts";

const schema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  specialization: z.string().trim().min(2, "Specialization is required").max(100),
  clinicName: z.string().trim().min(2, "Clinic name is required").max(200),
  qualifications: z.string().trim().max(200).optional(),
  registrationNumber: z.string().trim().max(100).optional(),
  consultationAddress: z.string().trim().max(300).optional(),
  consultationPhone: z.string().trim().max(20).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = schema.parse(body);

    // Check if phone is already registered
    const phoneHash = hashPhone(parsed.phone);
    const existingUser = findUserByPhone(phoneHash);

    if (existingUser) {
      // Phone already belongs to someone — do not reveal role details
      return err(
        "PHONE_ALREADY_REGISTERED",
        "This phone number is already associated with an account. Please use a different number or sign in.",
        409
      );
    }

    // Issue OTP via existing infrastructure
    const { issuance, code } = issueOtp(parsed.phone);
    try {
      await sendOtpSms(parsed.phone, code);
    } catch (error) {
      discardOtp(issuance.requestId);
      console.error("[OTP SMS] Delivery failed", error);
      if (error instanceof SmsDeliveryError && error.code === "NOT_CONFIGURED") {
        return err(
          "OTP_SMS_NOT_CONFIGURED",
          "SMS delivery is not configured on this server. Set MSG91_AUTH_KEY and MSG91_OTP_TEMPLATE_ID, then restart the app.",
          503
        );
      }
      return err("OTP_DELIVERY_FAILED", "SMS delivery failed. Check the MSG91 configuration and try again.", 502);
    }

    return NextResponse.json(
      {
        success: true,
        message: "OTP sent for doctor registration",
        data: {
          requestId: issuance.requestId,
          maskedPhone: issuance.maskedPhone,
          expiresInSeconds: issuance.expiresInSeconds,
          // Store registration payload for verify step
          registration: {
            phone: parsed.phone,
            displayName: parsed.displayName,
            specialization: parsed.specialization,
            clinicName: parsed.clinicName,
            qualifications: parsed.qualifications || undefined,
            registrationNumber: parsed.registrationNumber || undefined,
            consultationAddress: parsed.consultationAddress || undefined,
            consultationPhone: parsed.consultationPhone || undefined,
          },
        },
        ...(process.env.NODE_ENV === "development" && issuance._devOtp
          ? { otp: issuance._devOtp }
          : {}),
      },
      { status: 200 }
    );
  } catch (error) {
    return fromError(error);
  }
}
