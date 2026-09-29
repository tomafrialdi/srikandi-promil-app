import { ShieldCheck } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { BottomSheet } from "@/components/bottom-sheet";
import { ButtonOutline } from "@/components/button-outline";
import { colors, fonts, radius } from "@/constants/theme";
import { formatIsoDate } from "@/utils/calendar";
import { settingsApi } from "../../api/settings-api";
import type { PrivacyPolicy } from "../../types";

export function PrivacyPolicySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      gap={16}
      scrollable
      headerLeft={
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Privacy policy</Text>
          <PolicyDate />
        </View>
      }
    >
      <PolicyContent onClose={onClose} />
    </BottomSheet>
  );
}

/** Loads the policy once per open; both the header date and the body read from it. */
function usePolicy() {
  const [policy, setPolicy] = useState<PrivacyPolicy | null>(null);
  useEffect(() => {
    let cancelled = false;
    settingsApi.getPrivacyPolicy().then((p) => {
      if (!cancelled) setPolicy(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return policy;
}

function PolicyDate() {
  const policy = usePolicy();
  return <Text style={styles.updated}>{policy ? `Last updated ${formatIsoDate(policy.updatedAt)}` : " "}</Text>;
}

function PolicyContent({ onClose }: { onClose: () => void }) {
  const policy = usePolicy();

  return (
    <View style={styles.content}>
      {policy ? (
        <>
          <View style={styles.note}>
            <ShieldCheck size={16} color={colors.success} />
            <Text style={styles.noteText}>{policy.note}</Text>
          </View>
          <View style={styles.sections}>
            {policy.sections.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionBody}>{section.body}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
      <ButtonOutline label="Close" onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  titleBlock: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  updated: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkFaint },
  content: { alignSelf: "stretch", gap: 16 },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.successSoft,
  },
  noteText: { flex: 1, fontFamily: fonts.semibold, fontSize: 12, lineHeight: 17, color: colors.success },
  sections: { gap: 16 },
  section: { gap: 6 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  sectionBody: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, color: colors.inkMuted },
});
