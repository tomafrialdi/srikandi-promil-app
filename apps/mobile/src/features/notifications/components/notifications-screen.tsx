import { SlidersHorizontal } from "phosphor-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { FilterChips } from "@/components/filter-chips";
import { colors, fonts, radius } from "@/constants/theme";
import { useNotifications } from "../hooks/use-notifications";
import type { NotificationFilter } from "../types";
import { DiscreetBanner } from "./discreet-banner";
import { NotificationGroup } from "./notification-group";

const FILTERS: { id: NotificationFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "cycle", label: "Cycle" },
  { id: "reminders", label: "Reminders" },
  { id: "partner", label: "Partner" },
  { id: "community", label: "Community" },
];

export function NotificationsScreen() {
  const { loading, groups, settings, filter, setFilter, hasUnread, markRead, markAllRead } =
    useNotifications();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.padded, styles.headRow]}>
          <BackButton />
          <Text style={styles.title}>Notifications</Text>
          {/* TODO: open notification settings once that screen exists. */}
          <Pressable accessibilityRole="button" accessibilityLabel="Settings" style={styles.settings}>
            <SlidersHorizontal size={18} color={colors.ink} />
          </Pressable>
        </View>

        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />

        {settings?.discreetMode ? (
          <View style={styles.padded}>
            <DiscreetBanner />
          </View>
        ) : null}

        {!loading && groups.length === 0 ? (
          <View style={[styles.padded, styles.empty]}>
            <Text style={styles.emptyTitle}>{"You're all caught up"}</Text>
            <Text style={styles.emptyText}>New notifications will show up here.</Text>
          </View>
        ) : null}

        {groups.map((group, index) => (
          <View key={group.key} style={styles.padded}>
            <NotificationGroup
              group={group}
              // Shown once, on the first group, and only while something is unread.
              onMarkAllRead={index === 0 && hasUnread ? markAllRead : undefined}
              onItemPress={(n) => {
                if (!n.read) markRead(n.id);
                // TODO: open the related screen for this notification (`n.cta?.route`).
              }}
              // TODO: navigate to `cta.route` once those screens exist.
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { gap: 18, paddingTop: 8, paddingBottom: 32 },
  padded: { paddingHorizontal: 20 },
  headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  settings: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { alignItems: "center", gap: 4, paddingVertical: 48 },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  emptyText: { fontFamily: fonts.medium, fontSize: 13, color: colors.inkMuted },
});
