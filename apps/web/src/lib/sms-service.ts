const MSG91_FLOW_URL = "https://control.msg91.com/api/v5/flow/";

export async function sendOtpSms(phone: string, otp: string): Promise<void> {
  const authKey = process.env.MSG91_AUTH_KEY?.trim();
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID?.trim();

  if (process.env.NODE_ENV === "development" && !authKey && !templateId) {
    return;
  }

  if (!authKey || !templateId) {
    throw new Error("MSG91_AUTH_KEY and MSG91_OTP_TEMPLATE_ID must be configured");
  }

  const response = await fetch(MSG91_FLOW_URL, {
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

  if (!response.ok) {
    throw new Error(`MSG91 rejected the OTP request with status ${response.status}`);
  }

  const result: unknown = await response.json();
  if (
    typeof result === "object" &&
    result !== null &&
    "type" in result &&
    result.type === "error"
  ) {
    throw new Error("MSG91 rejected the OTP request");
  }
}
