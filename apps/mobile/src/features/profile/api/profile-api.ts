import { supabase } from "@/lib/supabase";

export interface OwnProfile {
  fullName: string;
}

/** The signed-in user's profile (their own `app_users` row; RLS hides everyone else's). */
export async function fetchOwnProfile(): Promise<OwnProfile> {
  const { data, error } = await supabase.from("app_users").select("full_name").single();
  if (error) throw new Error(error.message);
  return { fullName: data.full_name };
}
