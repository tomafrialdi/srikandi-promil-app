import { useState } from "react";

import { BottomSheet } from "@/components/bottom-sheet";
import { LOG_COPY } from "../content";
import { useLogging } from "../context/logging-context";
import type { LogKind } from "../types";
import { CervicalFluidSheet } from "./sheets/cervical-fluid-sheet";
import { IntimacySheet } from "./sheets/intimacy-sheet";
import { LhTestSheet } from "./sheets/lh-test-sheet";
import { LogTodaySheet } from "./sheets/log-today-sheet";
import { MedicationsSheet } from "./sheets/medications-sheet";
import { MoodSheet } from "./sheets/mood-sheet";
import { SymptomSheet } from "./sheets/symptom-sheet";
import { TemperatureSheet } from "./sheets/temperature-sheet";

/**
 * The one bottom sheet for every log. Switching between sheets (hub -> tracker -> hub)
 * swaps the content without closing, so the overlay never flickers.
 */
export function LogSheetHost() {
  const { data, active, closeLog } = useLogging();

  // Keep showing the last sheet while the close animation plays.
  const [lastActive, setLastActive] = useState<LogKind | null>(active);
  if (active && active !== lastActive) setLastActive(active);
  const shown = active ?? lastActive;

  if (!data || !shown) return null;

  return (
    <BottomSheet visible={active !== null} onClose={closeLog} title={LOG_COPY.titles[shown]}>
      {renderSheet(shown, data)}
    </BottomSheet>
  );
}

function renderSheet(kind: LogKind, data: NonNullable<ReturnType<typeof useLogging>["data"]>) {
  switch (kind) {
    case "log-today":
      return <LogTodaySheet overview={data.overview} />;
    case "temperature":
      return <TemperatureSheet config={data.temperature} />;
    case "mood":
      return <MoodSheet config={data.mood} />;
    case "symptom":
      return <SymptomSheet symptoms={data.symptoms} />;
    case "medications":
      return <MedicationsSheet medications={data.medications} />;
    case "cervical-fluid":
      return <CervicalFluidSheet config={data.cervicalFluid} />;
    case "lh-test":
      return <LhTestSheet config={data.lhTest} />;
    case "intimacy":
      return <IntimacySheet config={data.intimacy} />;
  }
}
