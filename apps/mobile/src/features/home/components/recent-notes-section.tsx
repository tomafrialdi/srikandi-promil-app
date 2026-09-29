import { StyleSheet, Text, View } from "react-native";

import { SectionHeader } from "@/components/section-header";
import { colors, fonts, radius } from "@/constants/theme";
import { HOME_ICONS } from "../icons";
import type { HomeDashboard, Note } from "../types";

interface RecentNotesSectionProps {
  data: HomeDashboard["notes"];
  onSeeAllPress?: () => void;
}

export function RecentNotesSection({ data, onSeeAllPress }: RecentNotesSectionProps) {
  return (
    <View style={styles.section}>
      <SectionHeader title={data.title} actionLabel={data.actionLabel} onActionPress={onSeeAllPress} />
      <View style={styles.list}>
        {data.items.map((note) => (
          <NoteItem key={note.id} note={note} />
        ))}
      </View>
    </View>
  );
}

function NoteItem({ note }: { note: Note }) {
  const NoteIcon = HOME_ICONS[note.icon];
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <NoteIcon size={16} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <Text style={styles.date}>{note.date}</Text>
        <Text style={styles.note}>{note.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 14 },
  list: { gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: 2 },
  date: { fontFamily: fonts.semibold, fontSize: 11, color: colors.inkFaint },
  note: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
});
