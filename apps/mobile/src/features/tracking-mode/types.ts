export type ModeIconName = "sparkle" | "pulse" | "syringe" | "hand-heart";
export type ChangeIconName = "calendar-x" | "test-tube" | "timer" | "book-open" | "calendar" | "bell" | "heart";

export interface ModeChange {
  icon: ChangeIconName;
  title: string;
  description: string;
}

export interface TrackingModeOption {
  id: string;
  title: string;
  description: string;
  icon: ModeIconName;
  /** Shown in "What changes in {changesTitle}", e.g. "PCOS mode". */
  changesTitle: string;
  changes: ModeChange[];
}

/** Everything the Tracking mode screen shows. The backend returns this shape. */
export interface TrackingModeData {
  selectedId: string;
  modes: TrackingModeOption[];
}
