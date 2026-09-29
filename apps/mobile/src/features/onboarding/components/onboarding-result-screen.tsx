import { router } from "expo-router";
import { CalendarHeart, CheckCircle, Clock, Heart, Info, type Icon } from "phosphor-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ButtonPrimary } from "@/components/button-primary";
import { colors, fonts, radius, tones } from "@/constants/theme";
import { useOnboarding } from "../context/onboarding-context";
import type { ResultIconName } from "../types";

const ICONS: Record<ResultIconName, Icon> = {
  "calendar-heart": CalendarHeart,
  heart: Heart,
  clock: Clock,
};

export function OnboardingResultScreen() {
  const { config, result } = useOnboarding();
  const { title, subtitle, note, ctaLabel, cards } = config.result;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <View style={styles.header}>
            <View style={styles.badge}>
              <CheckCircle size={32} color={colors.success} />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          </View>

          <View style={styles.cards}>
            {cards.map((card) => {
              const CardIcon = ICONS[card.icon];
              const tone = tones[card.tone];
              return (
                <View key={card.id} style={styles.card}>
                  <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
                    <CardIcon size={20} color={tone.fg} />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardLabel}>{card.label}</Text>
                    <Text style={styles.cardValue}>{result?.[card.valueKey] ?? "—"}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.note}>
            <Info size={16} color={colors.info} />
            <Text style={styles.noteText}>{note}</Text>
          </View>
        </View>

        <ButtonPrimary
          label={ctaLabel}
          onPress={() => router.push("/onboarding/sign-up")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: {
    flexGrow: 1,
    justifyContent: "space-between",
    gap: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  top: { gap: 28 },
  header: { alignItems: "center", gap: 14 },
  badge: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: { alignItems: "center", gap: 6 },
  title: { fontFamily: fonts.bold, fontSize: 22, color: colors.ink, textAlign: "center" },
  subtitle: {
    width: 280,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.inkMuted,
    textAlign: "center",
  },
  cards: { gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1, gap: 2 },
  cardLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.inkMuted },
  cardValue: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.infoSoft,
  },
  noteText: { flex: 1, fontFamily: fonts.medium, fontSize: 12, color: colors.info },
});
