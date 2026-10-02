import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTabBarClearance } from "@/components/tab-bar/tab-bar";
import { colors, fonts } from "@/constants/theme";
import { ContentCardSlot } from "@/features/content/components/content-card-slot";
import { useInsights } from "../hooks/use-insights";
import { CycleTrendCard } from "./cycle-trend-card";
import { StatRow } from "./stat-row";
import { SymptomFrequencyCard } from "./symptom-frequency-card";

/** Insights tab: headline stats, cycle length trend, and most logged symptoms. */
export function InsightsScreen() {
  const { data } = useInsights();
  const bottomClearance = useTabBarClearance();

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.head}>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>
            {data
              ? `Your cycle patterns over the last ${data.periodMonths} months`
              : "Your cycle patterns"}
          </Text>
        </View>

        <ContentCardSlot screen="insights" />

        {data ? (
          <>
            <StatRow stats={data.stats} />
            <CycleTrendCard trend={data.cycleTrend} />
            <SymptomFrequencyCard symptoms={data.symptoms} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { gap: 26, paddingTop: 8, paddingHorizontal: 20 },
  head: { gap: 2 },
  title: { fontFamily: fonts.bold, fontSize: 19, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 13, color: colors.inkMuted },
});
