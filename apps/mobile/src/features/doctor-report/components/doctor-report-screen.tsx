import {
  CalendarDots,
  Drop,
  Heart,
  NotePencil,
  Pill,
  ShareNetwork,
  TestTube,
  Thermometer,
  type Icon,
} from "phosphor-react-native";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { Alert, Share, StyleSheet, Text, View } from "react-native";

import { ButtonOutline } from "@/components/button-outline";
import { ButtonPrimary } from "@/components/button-primary";
import { IconButton } from "@/components/icon-button";
import { InsetList } from "@/components/list/inset-list";
import { InsetToggleItem } from "@/components/list/inset-toggle-item";
import { OptionPill } from "@/components/option-pill";
import { ScreenHeader } from "@/components/screen-header";
import { StickyScreen } from "@/components/sticky-screen";
import { SectionHeader } from "@/components/section-header";
import { colors, fonts } from "@/constants/theme";
import { NotAvailableError, reportApi } from "../api/report-api";
import { useReport } from "../hooks/use-report";
import type { ReportRange, ReportSection } from "../types";
import { ReportPreviewCard } from "./report-preview-card";

const RANGES: { id: ReportRange; label: string }[] = [
  { id: "last-3", label: "Last 3 cycles" },
  { id: "last-6", label: "Last 6 cycles" },
  { id: "all", label: "All" },
];

const SECTIONS: { key: ReportSection; label: string; icon: Icon }[] = [
  { key: "cycleHistory", label: "Cycle & period history", icon: CalendarDots },
  { key: "bbt", label: "BBT charts", icon: Thermometer },
  { key: "tests", label: "LH & pregnancy tests", icon: TestTube },
  { key: "fluidSymptoms", label: "Cervical fluid & symptoms", icon: Drop },
  { key: "medications", label: "Medications & supplements", icon: Pill },
  { key: "intimacy", label: "Intimacy log", icon: Heart },
  { key: "notes", label: "Personal notes", icon: NotePencil },
];

/** Features not built yet say so ("coming soon"); real failures get a retry hint. */
function notify(error: unknown, failureTitle: string) {
  if (error instanceof NotAvailableError) Alert.alert("Coming soon", error.message);
  else Alert.alert(failureTitle, "Please try again.");
}

export function DoctorReportScreen() {
  const { range, setRange, preview, include, toggle } = useReport();
  const [busy, setBusy] = useState<"export" | "send" | null>(null);

  const handleShare = () => {
    if (!preview) return;
    Share.share({ message: `${preview.name} — cycle report, ${preview.rangeLabel}` });
  };

  const handleExport = async () => {
    if (!include) return;
    setBusy("export");
    try {
      const { uri } = await reportApi.exportPdf({ range, include });
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Report ready", "Sharing isn't available on this device.");
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: "Share your doctor report",
      });
    } catch (e) {
      notify(e, "Couldn't create the PDF");
    } finally {
      setBusy(null);
    }
  };

  const handleSend = async () => {
    if (!include) return;
    setBusy("send");
    try {
      await reportApi.sendToClinic({ range, include });
      // TODO: let the user pick which clinic to send to.
      Alert.alert("Sent", "Your report was sent to your clinic.");
    } catch (e) {
      notify(e, "Couldn't send the report");
    } finally {
      setBusy(null);
    }
  };

  return (
    <StickyScreen header={<ScreenHeader title="Doctor report" right={<IconButton icon={ShareNetwork} label="Share" onPress={handleShare} />} />}>

        <Text style={styles.intro}>
          A clinical summary of your cycles to bring to your OB-GYN or fertility specialist.
        </Text>

        <View style={styles.ranges}>
          {RANGES.map((r) => (
            <OptionPill key={r.id} label={r.label} selected={r.id === range} onPress={() => setRange(r.id)} />
          ))}
        </View>

        {preview ? <ReportPreviewCard preview={preview} /> : null}

        {include ? (
          <>
            <SectionHeader title="Include in report" />
            <InsetList>
              {SECTIONS.map((section) => (
                <InsetToggleItem
                  key={section.key}
                  icon={section.icon}
                  label={section.label}
                  value={include[section.key]}
                  onValueChange={(v) => toggle(section.key, v)}
                />
              ))}
            </InsetList>
          </>
        ) : null}

        <View style={styles.actions}>
          <ButtonPrimary
            label={busy === "export" ? "Preparing PDF…" : "Export PDF"}
            onPress={handleExport}
            disabled={!include || busy !== null}
          />
          <ButtonOutline label="Send to my clinic" onPress={handleSend} disabled={!include || busy !== null} />
        </View>
    </StickyScreen>
  );
}

const styles = StyleSheet.create({
  intro: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.inkMuted },
  ranges: { flexDirection: "row", gap: 8 },
  actions: { gap: 10 },
});
