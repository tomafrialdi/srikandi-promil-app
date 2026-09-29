import type { Tone } from "@/constants/theme";

/** Filter chips on the list screen. */
export type SpecialistFilter = "all" | "ob-gyn" | "fertility-clinic" | "open-now";

export interface Availability {
  label: string;
  tone: Extract<Tone, "success" | "warning">;
  openNow: boolean;
}

/** One row of the "Nearby specialists" list. */
export interface SpecialistSummary {
  id: string;
  /** "doctor" rows have no detail screen yet. */
  kind: "clinic" | "doctor";
  name: string;
  /** Shown as the pink tag, e.g. "OB-GYN" or "Fertility clinic". */
  typeLabel: string;
  category: "ob-gyn" | "fertility-clinic";
  availability: Availability;
  rating: number;
  address: string;
  distanceKm: number;
  /** Dialable number. */
  phone: string;
  /** International format without "+", e.g. "6281234567890". */
  whatsapp: string;
  location: { lat: number; lng: number };
}

export interface CostItem {
  label: string;
  value: string;
  /** Small green tag next to the label, e.g. "BPJS". */
  badge?: string;
}

/** Full clinic page. */
export interface SpecialistDetail {
  id: string;
  name: string;
  coverImageUrl: string | null;
  tags: { label: string; tone: Tone; verified?: boolean }[];
  rating: number;
  reviewCount: number;
  distanceKm: number;
  hoursLabel: string;
  phone: string;
  whatsapp: string;
  location: { lat: number; lng: number };
  bpjs: { title: string; description: string } | null;
  costs: CostItem[];
  costNote: string;
  doctors: { id: string; name: string; description: string }[];
  review: { author: string; rating: number; text: string } | null;
}

export interface SpecialistQuery {
  query?: string;
  filter?: SpecialistFilter;
}
