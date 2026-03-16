/**
 * Password validation (same rules as auth-service).
 * Required: length >= 8, uppercase, lowercase, number.
 * Special character optional but encouraged.
 */

const MIN_LENGTH = 8;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_NUMBER = /[0-9]/;
const HAS_SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

const MESSAGES = {
  length: "Password must be at least 8 characters long",
  uppercase: "Password must contain at least one uppercase letter",
  lowercase: "Password must contain at least one lowercase letter",
  number: "Password must contain at least one number",
  special: "Password should contain at least one special character",
};

/**
 * @param {string} password
 * @returns {{ isValid: boolean, errors: string[], strength: string }}
 */
export function validatePassword(password) {
  const errors = [];
  if (!password || typeof password !== "string") {
    return { isValid: false, errors: [MESSAGES.length], strength: "weak" };
  }

  if (password.length < MIN_LENGTH) errors.push(MESSAGES.length);
  if (!HAS_UPPERCASE.test(password)) errors.push(MESSAGES.uppercase);
  if (!HAS_LOWERCASE.test(password)) errors.push(MESSAGES.lowercase);
  if (!HAS_NUMBER.test(password)) errors.push(MESSAGES.number);
  const hasSpecial = HAS_SPECIAL.test(password);

  const requiredMet = errors.length === 0;
  const isValid = requiredMet;

  let strength = "weak";
  if (requiredMet) {
    strength = hasSpecial ? "strong" : "medium";
  }

  return { isValid, errors, strength };
}
