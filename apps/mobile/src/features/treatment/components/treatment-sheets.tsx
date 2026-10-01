import { CalendarBlank, Flask, Hospital, Pill, Stethoscope, User } from "phosphor-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { BottomSheet } from "@/components/bottom-sheet";
import { ButtonOutline } from "@/components/button-outline";
import { ButtonPrimary } from "@/components/button-primary";
import { DatePickerSheet } from "@/components/date-picker-sheet";
import { REQUIRED_MESSAGE } from "@/components/form/field-shell";
import { ChoiceChips } from "@/components/form/choice-chips";
import { SelectField } from "@/components/form/select-field";
import { TextField } from "@/components/form/text-field";
import { colors, fonts, type Tone } from "@/constants/theme";
import { startOfDay } from "@/utils/calendar";
import type {
  Appointment,
  AppointmentInput,
  LabInput,
  ScheduleInput,
  StartProgramInput,
  TreatmentProgram,
  TreatmentType,
} from "../types";
import { TIME_PATTERN, combine, formatDay, formatTime, toIsoDate } from "../utils/dates";

/** Runs a save, closes the sheet on success and shows the message when it fails. */
function useSave(onClose: () => void) {
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string>();

  const run = async (action: () => Promise<void>) => {
    setSaving(true);
    setFailure(undefined);
    try {
      await action();
      onClose();
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  return { saving, failure, run };
}

const FailureText = ({ message }: { message?: string }) =>
  message ? <Text style={styles.failure}>{message}</Text> : null;

interface SheetProps {
  visible: boolean;
  onClose: () => void;
}

/* ── Start a program ─────────────────────────────────────── */

const TYPE_OPTIONS: { value: TreatmentType; label: string }[] = [
  { value: "iui", label: "IUI" },
  { value: "ivf", label: "IVF" },
  { value: "medicated", label: "Medicated cycle" },
];

export function StartProgramSheet({
  visible,
  onClose,
  hasActive,
  onSave,
}: SheetProps & { hasActive: boolean; onSave: (input: StartProgramInput) => Promise<void> }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Start a treatment program" gap={18} scrollable>
      <StartProgramForm hasActive={hasActive} onClose={onClose} onSave={onSave} />
    </BottomSheet>
  );
}

function StartProgramForm({
  hasActive,
  onClose,
  onSave,
}: { hasActive: boolean; onClose: () => void; onSave: (input: StartProgramInput) => Promise<void> }) {
  const [type, setType] = useState<TreatmentType>("iui");
  const [protocol, setProtocol] = useState("");
  const [doctor, setDoctor] = useState("");
  const [cycleNo, setCycleNo] = useState("1");
  const [startedOn, setStartedOn] = useState(() => startOfDay(new Date()));
  const [picker, setPicker] = useState(false);
  const [cycleError, setCycleError] = useState<string>();
  const { saving, failure, run } = useSave(onClose);

  const today = startOfDay(new Date());
  const earliest = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

  const handleSave = () => {
    const cycle = Number(cycleNo);
    if (!Number.isInteger(cycle) || cycle < 1 || cycle > 50) {
      setCycleError("Enter a cycle number from 1 to 50");
      return;
    }
    run(() => onSave({ type, protocol: protocol.trim(), doctor: doctor.trim(), startedOn: toIsoDate(startedOn), cycleNo: cycle }));
  };

  return (
    <View style={styles.form}>
      {hasActive ? (
        <Text style={styles.note}>Your current program will be marked as ended.</Text>
      ) : null}
      <ChoiceChips options={TYPE_OPTIONS} value={type} onChange={(v) => setType(v as TreatmentType)} columns={3} />
      <TextField
        label="Protocol (optional)"
        placeholder="e.g. Letrozole"
        icon={Pill}
        value={protocol}
        onChange={setProtocol}
        autoCapitalize="sentences"
      />
      <TextField
        label="Doctor (optional)"
        placeholder="e.g. dr. Sarah Lestari"
        icon={Stethoscope}
        value={doctor}
        onChange={setDoctor}
        autoCapitalize="words"
      />
      <View style={styles.row}>
        <View style={styles.half}>
          <TextField
            label="Cycle no."
            icon={User}
            value={cycleNo}
            onChange={(v) => {
              setCycleNo(v.replace(/\D/g, ""));
              setCycleError(undefined);
            }}
            error={cycleError}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.half}>
          <SelectField
            label="Start date"
            icon={CalendarBlank}
            value={formatDay(startedOn)}
            active={picker}
            onPress={() => setPicker(true)}
          />
        </View>
      </View>
      <FailureText message={failure} />
      <ButtonPrimary label="Start program" onPress={handleSave} disabled={saving} />

      <DatePickerSheet
        visible={picker}
        title="Start date"
        value={startedOn}
        minDate={earliest}
        maxDate={today}
        onClose={() => setPicker(false)}
        onConfirm={(d) => {
          setStartedOn(d);
          setPicker(false);
        }}
      />
    </View>
  );
}

/* ── Current program: stage + end ────────────────────────── */

export function ProgramSheet({
  visible,
  onClose,
  program,
  onSetStage,
  onEnd,
}: SheetProps & {
  program: TreatmentProgram;
  onSetStage: (index: number) => Promise<void>;
  onEnd: () => Promise<void>;
}) {
  const { saving, failure, run } = useSave(onClose);
  return (
    <BottomSheet visible={visible} onClose={onClose} title={program.title} subtitle="Where are you in this cycle?" gap={18}>
      <View style={styles.form}>
        <ChoiceChips
          options={program.stages.map((s, i) => ({ value: String(i), label: s.label }))}
          value={String(program.currentStageIndex)}
          onChange={(v) => run(() => onSetStage(Number(v)))}
          columns={2}
        />
        <FailureText message={failure} />
        <ButtonOutline label="End this program" tone="danger" disabled={saving} onPress={() => run(onEnd)} />
      </View>
    </BottomSheet>
  );
}

/* ── Schedule item ───────────────────────────────────────── */

const KIND_OPTIONS = [
  { value: "medication", label: "Medication" },
  { value: "event", label: "Event / reminder" },
];

export function ScheduleItemSheet({
  visible,
  onClose,
  onSave,
}: SheetProps & { onSave: (input: ScheduleInput) => Promise<void> }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add to schedule" gap={18} scrollable>
      <ScheduleItemForm onClose={onClose} onSave={onSave} />
    </BottomSheet>
  );
}

function ScheduleItemForm({ onClose, onSave }: { onClose: () => void; onSave: (input: ScheduleInput) => Promise<void> }) {
  const [kind, setKind] = useState<ScheduleInput["kind"]>("medication");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [titleError, setTitleError] = useState<string>();
  const { saving, failure, run } = useSave(onClose);

  const handleSave = () => {
    if (!title.trim()) {
      setTitleError(REQUIRED_MESSAGE);
      return;
    }
    run(() => onSave({ title: title.trim(), description: description.trim(), kind, tag: kind === "event" ? "Reminder on" : undefined }));
  };

  return (
    <View style={styles.form}>
      <ChoiceChips options={KIND_OPTIONS} value={kind} onChange={(v) => setKind(v as ScheduleInput["kind"])} columns={2} />
      <TextField
        label={kind === "medication" ? "Medication" : "Event"}
        placeholder={kind === "medication" ? "e.g. Letrozole 5 mg" : "e.g. Ovidrel trigger shot"}
        icon={Pill}
        value={title}
        onChange={(v) => {
          setTitle(v);
          setTitleError(undefined);
        }}
        error={titleError}
        autoCapitalize="sentences"
      />
      <TextField
        label="Details (optional)"
        placeholder={kind === "medication" ? "e.g. 08:00 · after breakfast" : "e.g. Sat 24 May · 21:00 sharp"}
        value={description}
        onChange={setDescription}
        autoCapitalize="sentences"
      />
      <FailureText message={failure} />
      <ButtonPrimary label="Add" onPress={handleSave} disabled={saving} />
    </View>
  );
}

/* ── Appointment ─────────────────────────────────────────── */

export function AppointmentSheet({
  visible,
  onClose,
  current,
  onSave,
}: SheetProps & { current: Appointment | null; onSave: (input: AppointmentInput) => Promise<void> }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Next appointment" gap={18} scrollable>
      <AppointmentForm current={current} onClose={onClose} onSave={onSave} />
    </BottomSheet>
  );
}

function AppointmentForm({
  current,
  onClose,
  onSave,
}: { current: Appointment | null; onClose: () => void; onSave: (input: AppointmentInput) => Promise<void> }) {
  const initial = current ? new Date(current.startsAt) : null;
  const [title, setTitle] = useState(current?.title ?? "");
  const [place, setPlace] = useState(current?.place ?? "");
  const [day, setDay] = useState<Date | null>(initial ? startOfDay(initial) : null);
  const [time, setTime] = useState(initial ? formatTime(initial) : "");
  const [picker, setPicker] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; day?: string; time?: string }>({});
  const { saving, failure, run } = useSave(onClose);

  const today = startOfDay(new Date());
  const latest = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

  const handleSave = () => {
    const next: typeof errors = {};
    if (!title.trim()) next.title = REQUIRED_MESSAGE;
    if (!day) next.day = REQUIRED_MESSAGE;
    if (!TIME_PATTERN.test(time)) next.time = "Use 24h time, e.g. 09:30";
    setErrors(next);
    if (Object.keys(next).length > 0 || !day) return;
    run(() => onSave({ startsAt: combine(day, time).toISOString(), title: title.trim(), place: place.trim() }));
  };

  return (
    <View style={styles.form}>
      <TextField
        label="What"
        placeholder="e.g. Follicle ultrasound"
        icon={Stethoscope}
        value={title}
        onChange={(v) => {
          setTitle(v);
          setErrors((e) => ({ ...e, title: undefined }));
        }}
        error={errors.title}
        autoCapitalize="sentences"
      />
      <TextField
        label="Where (optional)"
        placeholder="e.g. Bunda Women's Clinic"
        icon={Hospital}
        value={place}
        onChange={setPlace}
        autoCapitalize="words"
      />
      <View style={styles.row}>
        <View style={styles.half}>
          <SelectField
            label="Date"
            icon={CalendarBlank}
            placeholder="Pick a date"
            value={day ? formatDay(day) : ""}
            error={errors.day}
            active={picker}
            onPress={() => setPicker(true)}
          />
        </View>
        <View style={styles.half}>
          <TextField
            label="Time"
            placeholder="09:30"
            value={time}
            onChange={(v) => {
              setTime(v.replace(/[^\d:]/g, "").slice(0, 5));
              setErrors((e) => ({ ...e, time: undefined }));
            }}
            error={errors.time}
            keyboardType="numbers-and-punctuation"
          />
        </View>
      </View>
      <FailureText message={failure} />
      <ButtonPrimary label="Save" onPress={handleSave} disabled={saving} />

      <DatePickerSheet
        visible={picker}
        title="Appointment date"
        value={day}
        minDate={today}
        maxDate={latest}
        onClose={() => setPicker(false)}
        onConfirm={(d) => {
          setDay(d);
          setErrors((e) => ({ ...e, day: undefined }));
          setPicker(false);
        }}
      />
    </View>
  );
}

/* ── Lab result ──────────────────────────────────────────── */

const STATUS_OPTIONS: { value: string; label: string; tone: Tone }[] = [
  { value: "normal", label: "Normal", tone: "success" },
  { value: "watch", label: "Watch", tone: "warning" },
  { value: "high", label: "Out of range", tone: "error" },
];

export function LabSheet({
  visible,
  onClose,
  onSave,
}: SheetProps & { onSave: (input: LabInput) => Promise<void> }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add lab result" gap={18} scrollable>
      <LabForm onClose={onClose} onSave={onSave} />
    </BottomSheet>
  );
}

function LabForm({ onClose, onSave }: { onClose: () => void; onSave: (input: LabInput) => Promise<void> }) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("normal");
  const [errors, setErrors] = useState<{ label?: string; value?: string }>({});
  const { saving, failure, run } = useSave(onClose);

  const handleSave = () => {
    const next: typeof errors = {};
    if (!label.trim()) next.label = REQUIRED_MESSAGE;
    if (!value.trim()) next.value = REQUIRED_MESSAGE;
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    const chosen = STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];
    run(() => onSave({ label: label.trim(), value: value.trim(), statusLabel: chosen.label, tone: chosen.tone }));
  };

  return (
    <View style={styles.form}>
      <TextField
        label="Test"
        placeholder="e.g. AMH"
        icon={Flask}
        value={label}
        onChange={(v) => {
          setLabel(v);
          setErrors((e) => ({ ...e, label: undefined }));
        }}
        error={errors.label}
        autoCapitalize="characters"
      />
      <TextField
        label="Result"
        placeholder="e.g. 2.4 ng/mL"
        value={value}
        onChange={(v) => {
          setValue(v);
          setErrors((e) => ({ ...e, value: undefined }));
        }}
        error={errors.value}
        autoCapitalize="none"
      />
      <ChoiceChips options={STATUS_OPTIONS} value={status} onChange={setStatus} columns={3} />
      <FailureText message={failure} />
      <ButtonPrimary label="Add" onPress={handleSave} disabled={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { alignSelf: "stretch", gap: 16 },
  row: { flexDirection: "row", gap: 14 },
  half: { flex: 1 },
  note: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: colors.inkMuted },
  failure: { fontFamily: fonts.medium, fontSize: 12, color: colors.error },
});
