import { Pulse } from "phosphor-react-native";
import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { BottomSheet } from "@/components/bottom-sheet";
import { colors, radius } from "@/constants/theme";
import { LOG_COPY } from "../content";
import { useLogging } from "../context/logging-context";
import type { LogKind, LoggingData } from "../types";
import { BasalGuideSheet } from "./sheets/basal-guide-sheet";
import { CervicalFluidSheet } from "./sheets/cervical-fluid-sheet";
import { IntimacySheet } from "./sheets/intimacy-sheet";
import { LhTestSheet } from "./sheets/lh-test-sheet";
import { LogTodaySheet } from "./sheets/log-today-sheet";
import { MedicationsSheet } from "./sheets/medications-sheet";
import { NoteSheet } from "./sheets/note-sheet";
import { MoodSheet } from "./sheets/mood-sheet";
import { PregnancyTestSheet } from "./sheets/pregnancy-test-sheet";
import { SupplementSheet } from "./sheets/supplement-sheet";
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
    <BottomSheet visible={active !== null} onClose={closeLog} {...headerFor(shown, data)}>
      {renderSheet(shown, data)}
    </BottomSheet>
  );
}

/** Header props (title, subtitle, custom left, spacing) for each sheet. */
function headerFor(
  kind: LogKind,
  data: LoggingData,
): { title?: string; subtitle?: string; headerLeft?: ReactNode; gap?: number; scrollable?: boolean } {
  switch (kind) {
    case "prenatal-vitamin":
    case "folic-acid": {
      const { title, subtitle } = data.supplements[kind];
      return { title, subtitle, gap: 16 };
    }
    case "basal-temperature-guide":
      return {
        gap: 18,
        headerLeft: (
          <View style={styles.guideIcon}>
            <Pulse size={20} color={colors.success} />
          </View>
        ),
      };
    case "new-note":
      return { title: LOG_COPY.titles[kind], scrollable: true };
    default:
      return { title: LOG_COPY.titles[kind] };
  }
}

function renderSheet(kind: LogKind, data: LoggingData) {
  switch (kind) {
    case "log-today":
      return <LogTodaySheet overview={data.overview} />;
    case "new-note":
      return <NoteSheet data={data} />;
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
    case "pregnancy-test":
      return <PregnancyTestSheet config={data.pregnancyTest} />;
    case "prenatal-vitamin":
    case "folic-acid":
      return <SupplementSheet category={kind} catalog={data.supplements[kind]} />;
    case "basal-temperature-guide":
      return <BasalGuideSheet guide={data.basalGuide} />;
  }
}

const styles = StyleSheet.create({
  guideIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },
});
