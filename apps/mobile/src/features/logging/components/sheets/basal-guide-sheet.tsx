import { Info } from "phosphor-react-native";
import { StyleSheet, Text, View } from "react-native";

import { ButtonPrimary } from "@/components/button-primary";
import { LinkButton } from "@/components/link-button";
import { colors, fonts, radius } from "@/constants/theme";
import { LOG_COPY } from "../../content";
import { useLogging } from "../../context/logging-context";
import type { LoggingData } from "../../types";
import { SheetContent } from "../parts/sheet-content";

const copy = LOG_COPY.basalGuide;

/** Explains how to measure basal temperature. The icon box + close button are the sheet header. */
export function BasalGuideSheet({ guide }: { guide: LoggingData["basalGuide"] }) {
  const { closeLog, openLog } = useLogging();

  return (
    <SheetContent gap={18}>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>{guide.title}</Text>
        <Text style={styles.subtitle}>{guide.subtitle}</Text>
      </View>

      <View style={styles.steps}>
        {guide.steps.map((step, i) => (
          <View key={step} style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={styles.tip}>
        <Info size={16} color={colors.info} />
        <Text style={styles.tipText}>{guide.tip}</Text>
      </View>

      {/* TODO: schedule a daily local notification (expo-notifications) before closing. */}
      <ButtonPrimary label={copy.setReminder} onPress={closeLog} />
      <LinkButton label={copy.logToday} onPress={() => openLog("temperature")} />
    </SheetContent>
  );
}

const styles = StyleSheet.create({
  titleBlock: { gap: 4 },
  title: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 12, color: colors.inkMuted },
  steps: { gap: 14 },
  step: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { fontFamily: fonts.bold, fontSize: 12, color: colors.success },
  stepText: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  tip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.infoSoft,
  },
  tipText: { flex: 1, fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: colors.info },
});
