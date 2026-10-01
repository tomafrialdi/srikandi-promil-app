import { dummyCheckInSummary } from "@/features/check-in/api/dummy-check-in-api";
import { fetchOwnProfile } from "@/features/profile/api/profile-api";
import localDashboard from "../data/home-dashboard.json";
import type { HomeDashboard } from "../types";

/**
 * Loads everything the Home screen shows.
 * TODO(backend): the cards are still dummy data; only `user` comes from the backend so far.
 * The dummy takes the check-in card's state from the check-in feature so both stay in sync.
 */
export async function fetchHomeDashboard(): Promise<HomeDashboard> {
  const dashboard = localDashboard as unknown as HomeDashboard;
  // A failed profile request must not blank Home: fall back to a nameless greeting.
  const profile = await fetchOwnProfile().catch(() => null);
  return {
    ...dashboard,
    user: { ...dashboard.user, name: profile?.fullName ?? "" },
    checkIn: { ...dashboard.checkIn, ...dummyCheckInSummary() },
  };
}
