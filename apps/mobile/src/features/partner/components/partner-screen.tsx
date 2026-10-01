import {
  CalendarDots,
  CigaretteSlash,
  Gear,
  HeartStraight,
  Microscope,
  NotePencil,
  Smiley,
  Snowflake,
  Sparkle,
  TestTube,
  type Icon,
} from "phosphor-react-native";
import { useState } from "react";
import { Share, StyleSheet, Text, View } from "react-native";

import { ButtonPrimary } from "@/components/button-primary";
import { IconButton } from "@/components/icon-button";
import { IconCircle } from "@/components/icon-circle";
import { InsetList } from "@/components/list/inset-list";
import { InsetToggleItem } from "@/components/list/inset-toggle-item";
import { ScreenHeader } from "@/components/screen-header";
import { StickyScreen } from "@/components/sticky-screen";
import { SectionHeader } from "@/components/section-header";
import { colors, fonts } from "@/constants/theme";
import { partnerApi } from "../api/partner-api";
import { usePartner } from "../hooks/use-partner";
import type { ShareKey, TipIconName } from "../types";
import { PartnerCard } from "./partner-card";
import { PartnerSheet } from "./partner-sheet";

const SHARE_ITEMS: { key: ShareKey; label: string; icon: Icon }[] = [
  { key: "fertileWindow", label: "Fertile window & ovulation", icon: Sparkle },
  { key: "periodDates", label: "Period dates", icon: CalendarDots },
  { key: "testResults", label: "Test results", icon: TestTube },
  { key: "mood", label: "Mood & check-ins", icon: Smiley },
  { key: "symptomsNotes", label: "Symptoms & notes", icon: NotePencil },
];

const TIP_ICONS: Record<TipIconName, Icon> = {
  cool: Snowflake,
  "no-smoking": CigaretteSlash,
  analysis: Microscope,
};

export function PartnerScreen() {
  const { data, error, save, remove, setSharing } = usePartner();
  const [sheetOpen, setSheetOpen] = useState(false);
  const partner = data?.partner ?? null;

  const handleSendTips = async () => {
    if (!data) return;
    await partnerApi.sendTips();
    // Tips go out through the system share sheet, so any app can deliver them.
    await Share.share({ message: data.tips.map((t) => `• ${t.title}: ${t.description}`).join("\n") });
  };

  return (
    <>
      <StickyScreen
        header={
          <ScreenHeader
            title="Partner"
            right={<IconButton icon={Gear} label="Partner settings" onPress={() => setSheetOpen(true)} />}
          />
        }
      >
        {error && !data ? <Text style={styles.hint}>{"Couldn't load your partner. Go back and try again."}</Text> : null}

        {data && !partner ? (
          <View style={styles.empty}>
            <IconCircle icon={HeartStraight} tone="info" size={48} />
            <Text style={styles.emptyTitle}>Trying together</Text>
            <Text style={styles.emptyText}>
              Add your partner to choose what you share with them, and to get tips for the two of you.
            </Text>
            <ButtonPrimary label="Add partner" onPress={() => setSheetOpen(true)} style={styles.emptyButton} />
          </View>
        ) : null}

        {data && partner ? (
          <>
            <PartnerCard data={{ ...data, partner }} />

            <SectionHeader title="What you share" />
            <InsetList>
              {SHARE_ITEMS.map((item) => (
                <InsetToggleItem
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  value={data.sharing[item.key]}
                  onValueChange={(enabled) => setSharing(item.key, enabled)}
                />
              ))}
            </InsetList>

            <SectionHeader title="For him: male fertility" />
            <View style={styles.insight}>
              <Text style={styles.stat}>{data.maleInsight.stat}</Text>
              <Text style={styles.insightText}>{data.maleInsight.text}</Text>
            </View>

            <InsetList>
              {data.tips.map((tip) => (
                <View key={tip.id} style={styles.tip}>
                  <IconCircle icon={TIP_ICONS[tip.icon]} tone="info" size={36} />
                  <View style={styles.tipText}>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                    <Text style={styles.tipDescription}>{tip.description}</Text>
                  </View>
                </View>
              ))}
            </InsetList>

            <ButtonPrimary label={`Send tips to ${partner.name}`} onPress={handleSendTips} />
          </>
        ) : null}
      </StickyScreen>

      <PartnerSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        currentName={partner?.name ?? null}
        onSave={save}
        onRemove={remove}
      />
    </>
  );
}

const styles = StyleSheet.create({
  hint: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: colors.inkMuted },
  empty: {
    alignItems: "center",
    gap: 10,
    padding: 24,
    borderRadius: 20,
    backgroundColor: colors.infoSoft,
  },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  emptyText: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, textAlign: "center", color: colors.inkMuted },
  emptyButton: { alignSelf: "stretch", marginTop: 6 },
  insight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.infoSoft,
  },
  stat: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.info },
  insightText: { flex: 1, fontFamily: fonts.semibold, fontSize: 12, lineHeight: 17, color: colors.info },
  tip: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  tipText: { flex: 1, gap: 2 },
  tipTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  tipDescription: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkMuted },
});

