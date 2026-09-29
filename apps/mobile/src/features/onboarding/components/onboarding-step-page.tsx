import { ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";
import type { OnboardingStep } from "../types";
import { FieldRenderer } from "./field-renderer";

/** One slide of the pager: title block + the step's fields. */
export function OnboardingStepPage({ step, width }: { step: OnboardingStep; width: number }) {
  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.titleBlock}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.subtitle}>{step.subtitle}</Text>
      </View>
      <View style={styles.form}>
        {step.fields.map((field, i) => (
          <FieldRenderer key={field.type === "row" ? `row-${i}` : field.key} field={field} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 32, paddingTop: 32, paddingHorizontal: 20, paddingBottom: 24 },
  titleBlock: { gap: 8 },
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 14, color: colors.inkMuted },
  form: { gap: 18 },
});
