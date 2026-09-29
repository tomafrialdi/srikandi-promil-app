import {
  CalendarDots,
  CigaretteSlash,
  Gear,
  Microscope,
  NotePencil,
  Smiley,
  Snowflake,
  Sparkle,
  TestTube,
  type Icon,
} from "phosphor-react-native";
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
  const { data, setSharing } = usePartner();

  const handleSendTips = async () => {
    if (!data) return;
    await partnerApi.sendTips();
    // Also opens the system share sheet so tips can go out by any app.
    await Share.share({ message: data.tips.map((t) => `• ${t.title}: ${t.description}`).join("\n") });
  };

  return (
    <StickyScreen header={<ScreenHeader title="Partner" right={<IconButton icon={Gear} label="Partner settings" />} />}>
        {/* TODO: open partner settings (disconnect, invite again ...). */}

        {data ? (
          <>
            <PartnerCard data={data} />

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

            <ButtonPrimary label={`Send tips to ${data.partner.name}`} onPress={handleSendTips} />
          </>
        ) : null}
    </StickyScreen>
  );
}

const styles = StyleSheet.create({
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

