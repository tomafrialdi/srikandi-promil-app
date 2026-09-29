import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTabBarClearance } from "@/components/tab-bar/tab-bar";
import { colors } from "@/constants/theme";
import { useHomeDashboard } from "../hooks/use-home-dashboard";
import { logMood } from "../services/home-api";
import { ContentLibrarySection } from "./content-library-section";
import { CycleHeroCard } from "./cycle-hero-card";
import { DailyCheckInCard } from "./daily-checkin-card";
import { DailyTipCard } from "./daily-tip-card";
import { GreetingHeader } from "./greeting-header";
import { QuickActionsGrid } from "./quick-actions-grid";
import { RecentNotesSection } from "./recent-notes-section";
import { RecommendationsSection } from "./recommendations-section";

/** Home dashboard: sections top to bottom, each fed by one slice of `HomeDashboard`. */
export function HomeScreen() {
  const { data } = useHomeDashboard();
  const bottomClearance = useTabBarClearance();

  if (!data) return <SafeAreaView style={styles.safe} />;

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]}
        showsVerticalScrollIndicator={false}
      >
        {/* TODO: wire the onPress handlers below (log sheets, article / notes screens). */}
        <View style={styles.padded}>
          <GreetingHeader
            name={data.user.name}
            hasUnread={data.hasUnreadNotifications}
            onBellPress={() => router.push("/notifications")}
          />
        </View>
        <View style={styles.padded}>
          <CycleHeroCard cycle={data.cycle} />
        </View>
        <View style={styles.padded}>
          <QuickActionsGrid config={data.quickActions} />
        </View>
        <View style={styles.padded}>
          <DailyCheckInCard checkIn={data.checkIn} onMoodSelect={logMood} />
        </View>
        <View style={styles.padded}>
          <RecommendationsSection data={data.recommendations} />
        </View>
        <View style={styles.padded}>
          <DailyTipCard tip={data.tip} />
        </View>
        <ContentLibrarySection data={data.library} />
        <View style={styles.padded}>
          <RecentNotesSection data={data.notes} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { gap: 26, paddingTop: 8 },
  padded: { paddingHorizontal: 20 },
});
