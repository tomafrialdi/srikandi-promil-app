export { isValidEmail } from "@/utils/validation";

export interface PasswordStrength {
  /** Number of filled bars, 0–4. */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

const LABELS = ["", "Weak", "Fair", "Strong", "Very strong"] as const;

export function passwordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: LABELS[0] };
  const points = [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length as 0 | 1 | 2 | 3 | 4;
  const score = (password.length < 8 ? Math.min(points, 1) : Math.max(points, 1)) as
    | 1
    | 2
    | 3
    | 4;
  return { score, label: LABELS[score] };
}

export function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
