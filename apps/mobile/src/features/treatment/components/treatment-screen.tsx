import { CaretRight, Check, Pill, Plus, Syringe } from "phosphor-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Chip } from "@/components/chip";
import { IconButton } from "@/components/icon-button";
import { IconCircle } from "@/components/icon-circle";
import { InsetList } from "@/components/list/inset-list";
import { ScreenHeader } from "@/components/screen-header";
import { SectionHeader } from "@/components/section-header";
import { colors, fonts, radius } from "@/constants/theme";
import { MONTH_NAMES } from "@/utils/calendar";
import { useTreatment } from "../hooks/use-treatment";
import type { Appointment, LabResult, ScheduleItem } from "../types";
import { ProgramCard } from "./program-card";

export function TreatmentScreen() {
  const { data, setDone } = useTreatment();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* TODO: add a treatment protocol (no design yet). */}
        <ScreenHeader title="My treatment" right={<IconButton icon={Plus} label="Add treatment" />} />

        {data ? (
          <>
            <ProgramCard program={data.program} />

            <SectionHeader title="Today's schedule" />
            <InsetList>
              {data.schedule.map((item) => (
                <ScheduleRow key={item.id} item={item} onToggle={() => setDone(item.id, !item.done)} />
              ))}
            </InsetList>

            {data.appointment ? (
              <>
                <SectionHeader title="Next appointment" />
                <AppointmentCard appointment={data.appointment} />
              </>
            ) : null}

            {/* TODO: add a lab result (no design yet). */}
            <SectionHeader title="Lab results" actionLabel="Add" />
            <InsetList>
              {data.labs.map((lab) => (
                <LabRow key={lab.id} lab={lab} />
              ))}
            </InsetList>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ScheduleRow({ item, onToggle }: { item: ScheduleItem; onToggle: () => void }) {
  const isMedication = item.kind === "medication";
  return (
    <View style={styles.schedule}>
      <IconCircle icon={isMedication ? Pill : Syringe} tone={isMedication ? "success" : "primary"} size={36} />
      <View style={styles.scheduleText}>
        <Text style={styles.scheduleTitle}>{item.title}</Text>
        <Text style={styles.scheduleDescription}>{item.description}</Text>
      </View>
      {isMedication ? (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: !!item.done }}
          accessibilityLabel={item.title}
          onPress={onToggle}
          hitSlop={8}
          style={[styles.check, item.done && styles.checkDone]}
        >
          {item.done ? <Check size={13} weight="bold" color={colors.white} /> : null}
        </Pressable>
      ) : item.tag ? (
        <Chip label={item.tag} tone="primary" />
      ) : null}
    </View>
  );
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const date = new Date(appointment.startsAt);
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return (
    <Pressable accessibilityRole="button" style={styles.appointment}>
      <View style={styles.dateBox}>
        <Text style={styles.dateMonth}>{MONTH_NAMES[date.getMonth()].slice(0, 3).toUpperCase()}</Text>
        <Text style={styles.dateDay}>{date.getDate()}</Text>
      </View>
      <View style={styles.appointmentText}>
        <Text style={styles.appointmentTitle}>{appointment.title}</Text>
        <Text style={styles.appointmentPlace}>
          {time} · {appointment.place}
        </Text>
      </View>
      <CaretRight size={18} color={colors.info} />
    </Pressable>
  );
}

function LabRow({ lab }: { lab: LabResult }) {
  return (
    <View style={styles.lab}>
      <Text style={styles.labLabel}>{lab.label}</Text>
      <Text style={styles.labValue}>{lab.value}</Text>
      <Chip label={lab.status.label} tone={lab.status.tone} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { gap: 20, paddingTop: 8, paddingHorizontal: 20, paddingBottom: 32 },
  schedule: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  scheduleText: { flex: 1, gap: 2 },
  scheduleTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  scheduleDescription: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkMuted },
  check: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: { borderColor: colors.success, backgroundColor: colors.success },
  appointment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.infoSoft,
  },
  dateBox: {
    width: 52,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  dateMonth: { fontFamily: fonts.bold, fontSize: 10, color: colors.info },
  dateDay: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.info },
  appointmentText: { flex: 1, gap: 2 },
  appointmentTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.info },
  appointmentPlace: { fontFamily: fonts.medium, fontSize: 11, color: colors.info },
  lab: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  labLabel: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.inkMuted },
  labValue: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
});
