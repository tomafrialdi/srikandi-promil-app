import localDashboard from "../data/home-dashboard.json";
import type { HomeDashboard } from "../types";

/**
 * Loads everything the Home screen shows.
 * TODO(backend): replace with a request. The response only needs to match `HomeDashboard`.
 */
export async function fetchHomeDashboard(): Promise<HomeDashboard> {
  return localDashboard as HomeDashboard;
}

/** TODO(backend): store today's mood. */
export async function logMood(moodId: string): Promise<void> {
  console.log("[home] logMood", moodId);
}
