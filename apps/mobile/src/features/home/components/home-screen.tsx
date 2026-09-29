import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTabBarClearance } from "@/components/tab-bar/tab-bar";
import { colors } from "@/constants/theme";
import { useLogging } from "@/features/logging/context/logging-context";
import { QUICK_ACTION_TO_KIND, RECOMMENDATION_TO_KIND } from "@/features/logging/log-kinds";
import { useHomeDashboard } from "../hooks/use-home-dashboard";
import { CommunityCard } from "./community-card";
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
  const { openLog } = useLogging();
  const bottomClearance = useTabBarClearance();
  // The header stays pinned; a hairline appears under it once content scrolls beneath.
  const [scrolled, setScrolled] = useState(false);

  if (!data) return <SafeAreaView style={styles.safe} />;

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={[styles.header, scrolled && styles.headerScrolled]}>
        <GreetingHeader
          name={data.user.name}
          avatarUrl={data.user.avatarUrl}
          hasUnread={data.hasUnreadNotifications}
          onAvatarPress={() => router.navigate("/account")}
          onBellPress={() => router.push("/notifications")}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 2)}
      >
        {/* TODO: wire the remaining handlers (notes screen). */}
        <View style={styles.padded}>
          <CycleHeroCard cycle={data.cycle} onLogPress={() => openLog("log-today")} />
        </View>
        <View style={styles.padded}>
          <QuickActionsGrid
            config={data.quickActions}
            onActionPress={(action) => {
              const kind = QUICK_ACTION_TO_KIND[action.id];
              if (kind) openLog(kind);
            }}
          />
        </View>
        <View style={styles.padded}>
          <DailyCheckInCard
            checkIn={data.checkIn}
            onMoodSelect={(moodId) => router.push({ pathname: "/check-in", params: { mood: moodId } })}
          />
        </View>
        <View style={styles.padded}>
          <RecommendationsSection
            data={data.recommendations}
            onItemPress={(item) => {
              if (item.id === "obgyn") {
                router.push("/specialists");
                return;
              }
              const kind = RECOMMENDATION_TO_KIND[item.id];
              if (kind) openLog(kind);
            }}
          />
        </View>
        <View style={styles.padded}>
          <DailyTipCard tip={data.tip} />
        </View>
        <ContentLibrarySection
          data={data.library}
          onViewAllPress={() => router.push("/articles")}
          onArticlePress={(article) =>
            router.push({ pathname: "/articles/[id]", params: { id: article.id } })
          }
        />
        <View style={styles.padded}>
          <CommunityCard community={data.community} onPress={() => router.push("/community")} />
        </View>
        <View style={styles.padded}>
          <RecentNotesSection data={data.notes} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
    backgroundColor: colors.surface,
  },
  headerScrolled: { borderBottomColor: colors.border },
  content: { gap: 26, paddingTop: 4 },
  padded: { paddingHorizontal: 20 },
});
