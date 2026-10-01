/**
 * Client-safe auth utilities (no server-only imports).
 */

export function maskPhoneNumber(phone: string): string {
  if (phone.length < 4) return "••••••••••";
  return `${phone.slice(0, 2)}••••••${phone.slice(-2)}`;
}

export function formatPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 10) return phone;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.trim());
}

export function isValidOtp(otp: string): boolean {
  return /^\d{6}$/.test(otp.trim());
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
