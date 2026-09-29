/** Basic "name@domain.tld" check. The backend remains the source of truth. */
export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
