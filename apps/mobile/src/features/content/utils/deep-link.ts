import type { LogKind } from "@/features/logging/types";

export type DeepLinkTarget =
  | { type: "log"; kind: LogKind }
  | { type: "route"; href: string }
  | { type: "web"; url: string };

/** Log sheets by the short names editors use in the console, e.g. `srikandi://log/lh`. */
const LOG_KINDS: Record<string, LogKind> = {
  today: "log-today",
  "log-today": "log-today",
  temp: "temperature",
  temperature: "temperature",
  mood: "mood",
  symptom: "symptom",
  symptoms: "symptom",
  meds: "medications",
  medications: "medications",
  fluid: "cervical-fluid",
  "cervical-fluid": "cervical-fluid",
  lh: "lh-test",
  "lh-test": "lh-test",
  intimacy: "intimacy",
  preg: "pregnancy-test",
  "preg-test": "pregnancy-test",
  "pregnancy-test": "pregnancy-test",
};

/** Screens reachable by name, e.g. `srikandi://calendar`. */
const ROUTES: Record<string, string> = {
  home: "/home",
  calendar: "/calendar",
  insights: "/insights",
  account: "/account",
  settings: "/account",
  "check-in": "/check-in",
  articles: "/articles",
  notifications: "/notifications",
  specialists: "/specialists",
  community: "/community",
  treatment: "/settings/treatment",
  partner: "/settings/partner",
  "doctor-report": "/settings/doctor-report",
  "tracking-mode": "/settings/tracking-mode",
  "connected-devices": "/settings/connected-devices",
  privacy: "/settings/privacy-security",
};

/**
 * Turns a link from the console (article CTA, tip, card) into something the app can open.
 * Accepts `srikandi://…` and `srikandipromil://…`, and plain https links. Unknown links are ignored.
 */
export function parseDeepLink(url: string): DeepLinkTarget | null {
  const link = url.trim();
  if (/^https?:\/\//i.test(link)) return { type: "web", url: link };

  const match = /^(?:srikandi|srikandipromil):\/\/(.+)$/i.exec(link);
  if (!match) return null;
  const [head, ...rest] = match[1].replace(/^\/+|\/+$/g, "").split("/");
  const name = head.toLowerCase();

  if (name === "log") {
    const kind = LOG_KINDS[(rest[0] ?? "today").toLowerCase()];
    return kind ? { type: "log", kind } : null;
  }
  if ((name === "article" || name === "articles") && rest[0]) {
    return { type: "route", href: `/articles/${rest[0]}` };
  }
  const route = ROUTES[name];
  return route ? { type: "route", href: route } : null;
}
