import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ButtonPrimary } from "@/components/button-primary";
import { LinkButton } from "@/components/link-button";
import { OptionPill } from "@/components/option-pill";
import { colors, fonts } from "@/constants/theme";
import { LOG_COPY } from "../../content";
import { useLogging } from "../../context/logging-context";
import type { LoggingData } from "../../types";
import { SheetContent } from "../parts/sheet-content";
import { ValueStepper } from "../parts/value-stepper";

const copy = LOG_COPY.temperature;

export function TemperatureSheet({ config }: { config: LoggingData["temperature"] }) {
  const { save, entries } = useLogging();
  // Start from what was already logged today (from this sheet or "New note").
  const [celsius, setCelsius] = useState(entries.temperature?.celsius ?? config.default);
  const [timeOfDay, setTimeOfDay] = useState(entries.temperature?.timeOfDay ?? config.defaultTimeOfDay);
  const [saving, setSaving] = useState(false);

  // Round to one decimal so repeated +0.1 steps don't drift (36.6 + 0.1 = 36.7, not 36.700000001).
  const change = (delta: number) =>
    setCelsius((c) => {
      const next = Math.round((c + delta) * 10) / 10;
      return Math.min(config.max, Math.max(config.min, next));
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      await save({ kind: "temperature", celsius, timeOfDay });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetContent>
      <ValueStepper onDecrease={() => change(-config.step)} onIncrease={() => change(config.step)}>
        <Text style={styles.value}>{celsius.toFixed(1)}°C</Text>
        <Text style={styles.caption}>{config.caption}</Text>
      </ValueStepper>

      <View style={styles.pills}>
        {config.timesOfDay.map((t) => (
          <OptionPill
            key={t.id}
            label={t.label}
            selected={t.id === timeOfDay}
            onPress={() => setTimeOfDay(t.id)}
          />
        ))}
      </View>

      <ButtonPrimary label={copy.save} onPress={handleSave} disabled={saving} />
      {/* TODO: open the temperature history screen. */}
      <LinkButton label={copy.history} />
    </SheetContent>
  );
}

const styles = StyleSheet.create({
  value: { fontFamily: fonts.bold, fontSize: 34, color: colors.primary },
  caption: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkFaint },
  pills: { flexDirection: "row", gap: 10 },
});
