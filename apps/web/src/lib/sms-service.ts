const MSG91_FLOW_URL = "https://control.msg91.com/api/v5/flow/";

export class SmsDeliveryError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_CONFIGURED" | "PROVIDER_REJECTED"
  ) {
    super(message);
    this.name = "SmsDeliveryError";
  }
}

export async function sendOtpSms(phone: string, otp: string): Promise<void> {
  const authKey = process.env.MSG91_AUTH_KEY?.trim();
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID?.trim();

  if (process.env.NODE_ENV === "development" && !authKey && !templateId) {
    return;
  }

  if (!authKey || !templateId) {
    throw new SmsDeliveryError(
      "MSG91_AUTH_KEY and MSG91_OTP_TEMPLATE_ID must be configured",
      "NOT_CONFIGURED"
    );
  }

  let response: Response;
  try {
    response = await fetch(MSG91_FLOW_URL, {
      method: "POST",
      headers: {
        authkey: authKey,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        template_id: templateId,
        recipients: [
          {
            mobiles: `91${phone}`,
            VAR1: otp,
          },
        ],
      }),
    });
  } catch (error) {
    throw new SmsDeliveryError(
      error instanceof Error ? error.message : "MSG91 request failed",
      "PROVIDER_REJECTED"
    );
  }

  if (!response.ok) {
    throw new SmsDeliveryError(
      `MSG91 rejected the OTP request with status ${response.status}`,
      "PROVIDER_REJECTED"
    );
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new SmsDeliveryError("MSG91 returned an invalid response", "PROVIDER_REJECTED");
  }

  if (
    typeof result === "object" &&
    result !== null &&
    "type" in result &&
    result.type === "error"
  ) {
    throw new SmsDeliveryError("MSG91 rejected the OTP request", "PROVIDER_REJECTED");
  }
}
