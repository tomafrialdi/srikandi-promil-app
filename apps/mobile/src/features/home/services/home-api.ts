import { dummyCheckInSummary } from "@/features/check-in/api/dummy-check-in-api";
import localDashboard from "../data/home-dashboard.json";
import type { HomeDashboard } from "../types";

/**
 * Loads everything the Home screen shows.
 * TODO(backend): replace with a request. The response only needs to match `HomeDashboard`.
 * The dummy takes the check-in card's state from the check-in feature so both stay in sync.
 */
export async function fetchHomeDashboard(): Promise<HomeDashboard> {
  const dashboard = localDashboard as unknown as HomeDashboard;
  return { ...dashboard, checkIn: { ...dashboard.checkIn, ...dummyCheckInSummary() } };
}
