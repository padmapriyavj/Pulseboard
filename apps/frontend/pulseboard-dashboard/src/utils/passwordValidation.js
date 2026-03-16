/**
 * Client-side password validation (mirrors backend rules).
 * Required: length >= 8, uppercase, lowercase, number.
 * Special character optional but encouraged.
 */

const MIN_LENGTH = 8;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_NUMBER = /[0-9]/;
const HAS_SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export function validatePasswordClient(password) {
  const p = password || "";
  const checks = {
    length: p.length >= MIN_LENGTH,
    uppercase: HAS_UPPERCASE.test(p),
    lowercase: HAS_LOWERCASE.test(p),
    number: HAS_NUMBER.test(p),
    special: HAS_SPECIAL.test(p),
  };
  const requiredMet =
    checks.length && checks.uppercase && checks.lowercase && checks.number;
  const isValid = requiredMet;
  let strength = "weak";
  if (requiredMet) strength = checks.special ? "strong" : "medium";
  return { checks, isValid, strength };
}
