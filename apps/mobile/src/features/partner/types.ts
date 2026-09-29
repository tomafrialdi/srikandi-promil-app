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
  partner: { name: string; initial: string };
  /** Display text, e.g. "Connected since March · trying 8 months". */
  status: string;
  /** Sample of the notification the partner sees today. */
  preview: { message: string };
  sharing: Record<ShareKey, boolean>;
  maleInsight: { stat: string; text: string };
  tips: PartnerTip[];
}
