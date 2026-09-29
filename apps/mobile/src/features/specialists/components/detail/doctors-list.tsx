import { CaretRight } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SectionHeader } from "@/components/section-header";
import { colors, fonts, radius } from "@/constants/theme";
import type { SpecialistDetail } from "../../types";

interface DoctorsListProps {
  doctors: SpecialistDetail["doctors"];
  onSeeAllPress?: () => void;
  onDoctorPress?: (doctorId: string) => void;
}

export function DoctorsList({ doctors, onSeeAllPress, onDoctorPress }: DoctorsListProps) {
  return (
    <View style={styles.section}>
      <SectionHeader title="Specialists here" actionLabel="See all" onActionPress={onSeeAllPress} />
      <View style={styles.card}>
        {doctors.map((doctor, i) => (
          <Pressable
            key={doctor.id}
            accessibilityRole="button"
            onPress={() => onDoctorPress?.(doctor.id)}
            style={[styles.row, i < doctors.length - 1 && styles.rowDivider]}
          >
            <View style={styles.avatar}>
              <Text style={styles.initial}>{doctor.name.replace(/^dr\.?\s*/i, "").charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.text}>
              <Text style={styles.name}>{doctor.name}</Text>
              <Text style={styles.description}>{doctor.description}</Text>
            </View>
            <CaretRight size={16} color={colors.inkFaint} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 14 },
  card: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.infoSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontFamily: fonts.bold, fontSize: 15, color: colors.info },
  text: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  description: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkMuted },
});
