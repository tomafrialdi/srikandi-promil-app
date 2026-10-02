import { CaretRight, Check, Pill, Plus, Syringe } from "phosphor-react-native";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { ButtonPrimary } from "@/components/button-primary";
import { Chip } from "@/components/chip";
import { IconButton } from "@/components/icon-button";
import { IconCircle } from "@/components/icon-circle";
import { InsetList } from "@/components/list/inset-list";
import { ScreenHeader } from "@/components/screen-header";
import { StickyScreen } from "@/components/sticky-screen";
import { SectionHeader } from "@/components/section-header";
import { colors, fonts, radius } from "@/constants/theme";
import { MONTH_NAMES } from "@/utils/calendar";
import { VideoSection } from "@/features/content/components/video-section";
import { treatmentApi } from "../api/treatment-api";
import { useTreatment } from "../hooks/use-treatment";
import type { Appointment, LabResult, ScheduleItem } from "../types";
import { ProgramCard } from "./program-card";
import {
  AppointmentSheet,
  LabSheet,
  ProgramSheet,
  ScheduleItemSheet,
  StartProgramSheet,
} from "./treatment-sheets";

type SheetId = "start" | "program" | "item" | "appointment" | "lab";

export function TreatmentScreen() {
  const { data, error, mutate, setDone } = useTreatment();
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const close = () => setSheet(null);
  const program = data?.program ?? null;

  /** Long-press → confirm → delete. */
  const confirmDelete = (title: string, message: string, action: () => Promise<void>) =>
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => mutate(action).catch(() => Alert.alert("Couldn't delete", "Please try again.")),
      },
    ]);

  return (
    <>
      <StickyScreen
        header={
          <ScreenHeader
            title="My treatment"
            right={<IconButton icon={Plus} label="Start a treatment program" onPress={() => setSheet("start")} />}
          />
        }
      >
        {error && !data ? <Text style={styles.hint}>{"Couldn't load your treatment. Go back and try again."}</Text> : null}

        {data && !program ? <EmptyState onStart={() => setSheet("start")} /> : null}

        {data && program ? (
          <>
            <ProgramCard program={program} onPress={() => setSheet("program")} />

            <SectionHeader title="Today's schedule" actionLabel="Add" onActionPress={() => setSheet("item")} />
            {data.schedule.length > 0 ? (
              <InsetList>
                {data.schedule.map((item) => (
                  <ScheduleRow
                    key={item.id}
                    item={item}
                    onToggle={() => setDone(item.id, !item.done)}
                    onLongPress={() =>
                      confirmDelete("Remove from schedule?", item.title, () => treatmentApi.deleteScheduleItem(item.id))
                    }
                  />
                ))}
              </InsetList>
            ) : (
              <Text style={styles.hint}>No medications or events yet. Tap Add to build your schedule.</Text>
            )}

            <SectionHeader
              title="Next appointment"
              actionLabel={data.appointment ? "Change" : "Add"}
              onActionPress={() => setSheet("appointment")}
            />
            {data.appointment ? (
              <AppointmentCard
                appointment={data.appointment}
                onPress={() => setSheet("appointment")}
                onLongPress={() =>
                  confirmDelete("Remove appointment?", data.appointment?.title ?? "", () => treatmentApi.clearAppointment())
                }
              />
            ) : (
              <Text style={styles.hint}>No upcoming appointment.</Text>
            )}

            <SectionHeader title="Lab results" actionLabel="Add" onActionPress={() => setSheet("lab")} />
            {data.labs.length > 0 ? (
              <InsetList>
                {data.labs.map((lab) => (
                  <LabRow
                    key={lab.id}
                    lab={lab}
                    onLongPress={() =>
                      confirmDelete("Remove lab result?", `${lab.label} · ${lab.value}`, () => treatmentApi.deleteLab(lab.id))
                    }
                  />
                ))}
              </InsetList>
            ) : (
              <Text style={styles.hint}>No lab results yet.</Text>
            )}

            <VideoSection placement="treatment" title="Learn more" />
          </>
        ) : null}
      </StickyScreen>

      <StartProgramSheet
        visible={sheet === "start"}
        onClose={close}
        hasActive={!!program}
        onSave={(input) => mutate(() => treatmentApi.startProgram(input))}
      />
      {program ? (
        <>
          <ProgramSheet
            visible={sheet === "program"}
            onClose={close}
            program={program}
            onSetStage={(i) => mutate(() => treatmentApi.setStage(i))}
            onEnd={() => mutate(() => treatmentApi.endProgram())}
          />
          <ScheduleItemSheet
            visible={sheet === "item"}
            onClose={close}
            onSave={(input) => mutate(() => treatmentApi.addScheduleItem(input))}
          />
          <AppointmentSheet
            visible={sheet === "appointment"}
            onClose={close}
            current={data?.appointment ?? null}
            onSave={(input) => mutate(() => treatmentApi.setAppointment(input))}
          />
          <LabSheet visible={sheet === "lab"} onClose={close} onSave={(input) => mutate(() => treatmentApi.addLab(input))} />
        </>
      ) : null}
    </>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.empty}>
      <IconCircle icon={Syringe} tone="primary" size={48} />
      <Text style={styles.emptyTitle}>No treatment program yet</Text>
      <Text style={styles.emptyText}>
        Keep your IUI, IVF or medicated cycle in one place: medication schedule, appointments and lab results.
      </Text>
      <ButtonPrimary label="Start a program" onPress={onStart} style={styles.emptyButton} />
    </View>
  );
}

function ScheduleRow({
  item,
  onToggle,
  onLongPress,
}: {
  item: ScheduleItem;
  onToggle: () => void;
  onLongPress: () => void;
}) {
  const isMedication = item.kind === "medication";
  return (
    <Pressable onLongPress={onLongPress} delayLongPress={450} style={styles.schedule}>
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
    </Pressable>
  );
}

function AppointmentCard({
  appointment,
  onPress,
  onLongPress,
}: {
  appointment: Appointment;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const date = new Date(appointment.startsAt);
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} onLongPress={onLongPress} delayLongPress={450} style={styles.appointment}>
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

function LabRow({ lab, onLongPress }: { lab: LabResult; onLongPress: () => void }) {
  return (
    <Pressable onLongPress={onLongPress} delayLongPress={450} style={styles.lab}>
      <Text style={styles.labLabel}>{lab.label}</Text>
      <Text style={styles.labValue}>{lab.value}</Text>
      <Chip label={lab.status.label} tone={lab.status.tone} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hint: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: colors.inkMuted },
  empty: {
    alignItems: "center",
    gap: 10,
    padding: 24,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
  },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  emptyText: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, textAlign: "center", color: colors.inkMuted },
  emptyButton: { alignSelf: "stretch", marginTop: 6 },
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
