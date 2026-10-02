/** Thrown by features that aren't built yet, so the screen can say so instead of faking success. */
export class NotAvailableError extends Error {
  constructor(feature: string) {
    super(`${feature} isn't available yet.`);
    this.name = "NotAvailableError";
  }
}
