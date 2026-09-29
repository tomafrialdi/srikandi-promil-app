import { Lightbulb } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ButtonPrimary } from "@/components/button-primary";
import { InsightCard } from "@/components/insight-card";
import { colors, fonts, radius, tones } from "@/constants/theme";
import { LOG_COPY } from "../../content";
import { useLogging } from "../../context/logging-context";
import type { FluidOption, LoggingData } from "../../types";
import { SheetContent } from "../parts/sheet-content";

const copy = LOG_COPY.cervicalFluid;

export function CervicalFluidSheet({ config }: { config: LoggingData["cervicalFluid"] }) {
  const { save } = useLogging();
  const [fluidId, setFluidId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selected = config.options.find((o) => o.id === fluidId);

  const handleSave = async () => {
    if (!fluidId) return;
    setSaving(true);
    try {
      await save({ kind: "cervical-fluid", fluidId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetContent>
      <Text style={styles.subtitle}>{config.subtitle}</Text>

      <View style={styles.options}>
        {config.options.map((option) => (
          <FluidRow
            key={option.id}
            option={option}
            selected={option.id === fluidId}
            onPress={() => setFluidId(option.id)}
          />
        ))}
      </View>

      {selected ? <InsightCard icon={Lightbulb} tone="info" text={selected.insight} /> : null}

      <ButtonPrimary label={copy.save} onPress={handleSave} disabled={!fluidId || saving} />
    </SheetContent>
  );
}

function FluidRow({
  option,
  selected,
  onPress,
}: {
  option: FluidOption;
  selected: boolean;
  onPress: () => void;
}) {
  const tag = tones[option.tag.tone];
  const emphasis = option.tag.emphasis;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.row, selected && styles.rowSelected]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]} />
      <View style={styles.text}>
        <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
        <Text style={styles.description}>{option.description}</Text>
      </View>
      <View style={[styles.tag, { backgroundColor: emphasis ? tag.fg : tag.bg }]}>
        <Text style={[styles.tagText, { color: emphasis ? colors.white : tag.fg }]}>
          {option.tag.label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontFamily: fonts.medium, fontSize: 12, color: colors.inkMuted },
  options: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  rowSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  radio: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
    backgroundColor: colors.card,
  },
  radioSelected: { borderWidth: 5, borderColor: colors.primary },
  text: { flex: 1, gap: 1 },
  label: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  labelSelected: { color: colors.primary },
  description: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkMuted },
  tag: { paddingVertical: 4, paddingHorizontal: 9, borderRadius: radius.pill },
  tagText: { fontFamily: fonts.bold, fontSize: 10 },
});
