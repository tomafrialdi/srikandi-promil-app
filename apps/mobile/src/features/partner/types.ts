export type ShareKey =
  | "fertileWindow"
  | "periodDates"
  | "testResults"
  | "mood"
  | "symptomsNotes";

export type TipIconName = "cool" | "no-smoking" | "analysis";

export interface PartnerTip {
  id: string;
  icon: TipIconName;
  title: string;
  description: string;
}

/** Everything the Partner screen shows. The backend returns this shape. */
export interface PartnerData {
  me: { name: string; initial: string };
  /** null until the user adds their partner. */
  partner: { name: string; initial: string } | null;
  /** Display text, e.g. "Added March 2026 · account linking coming soon". */
  status: string;
  /** Sample of the notification the partner sees today. */
  preview: { message: string };
  sharing: Record<ShareKey, boolean>;
  maleInsight: { stat: string; text: string };
  tips: PartnerTip[];
}
