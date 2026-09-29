import type { Answers, OnboardingConfig } from "../types";
import { maskedDateToIso } from "./date";
import { flattenFields } from "./validate";

export type OnboardingPayload = Record<string, string | number | string[] | null>;

/** Converts raw form answers into the typed shape sent to the backend. */
export function buildPayload(config: OnboardingConfig, answers: Answers): OnboardingPayload {
  const payload: OnboardingPayload = {};

  for (const step of config.steps) {
    for (const field of flattenFields(step.fields)) {
      const value = answers[field.key];
      if (value === undefined || value.length === 0) {
        payload[field.key] = null;
      } else if (field.type === "date" && typeof value === "string") {
        payload[field.key] = maskedDateToIso(value);
      } else if (field.type === "number" && typeof value === "string") {
        payload[field.key] = Number(value);
      } else {
        payload[field.key] = value;
      }
    }
  }

  return payload;
}
