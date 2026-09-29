/**
 * Temporary mock credentials while there is no backend.
 * `services/auth-api.ts` checks against these when `enabled` is true.
 * TODO(backend): set `enabled` to false (or delete this file) once real auth is wired.
 */
export const DUMMY_AUTH = {
  enabled: true,
  email: "amara.putri@gmail.com",
  password: "Srikandi123!",
  otp: "123456",
} as const;
