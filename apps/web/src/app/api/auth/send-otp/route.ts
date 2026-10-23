import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { discardOtp, issueOtp } from "@/lib/store.ts";
import { err, fromError } from "@/lib/api-response.ts";
import { sendOtpSms, SmsDeliveryError } from "@/lib/sms-service.ts";

const schema = z.object({
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const { phone } = schema.parse(body);
    const { issuance, code } = issueOtp(phone);
    try {
      await sendOtpSms(phone, code);
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
