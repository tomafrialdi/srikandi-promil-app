import dummy from "./dummy-specialists.json";
import type { SpecialistDetail, SpecialistSummary } from "../types";
import type { SpecialistsApi } from "./specialists-api";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Mimics what the server does with `q` and `filter`. */
export const dummySpecialistsApi: SpecialistsApi = {
  async list({ query = "", filter = "all" } = {}) {
    await delay(200);
    const q = query.trim().toLowerCase();
    return (dummy.list as SpecialistSummary[]).filter((s) => {
      if (q && !`${s.name} ${s.address}`.toLowerCase().includes(q)) return false;
      if (filter === "ob-gyn" || filter === "fertility-clinic") return s.category === filter;
      if (filter === "open-now") return s.availability.openNow;
      return true;
    });
  },
  async getDetail(id) {
    await delay(200);
    const detail = (dummy.details as Record<string, SpecialistDetail>)[id];
    if (!detail) throw new Error(`Specialist not found: ${id}`);
    return detail;
  },
};
