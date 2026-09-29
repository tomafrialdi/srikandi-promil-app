import { Heart, Star } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { BottomSheet } from "@/components/bottom-sheet";
import { ButtonPrimary } from "@/components/button-primary";
import { colors, fonts, radius } from "@/constants/theme";
import type { FeedbackInput } from "../../types";

const STARS = [1, 2, 3, 4, 5];

interface RateAppSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: FeedbackInput) => Promise<void>;
}

export function RateAppSheet({ visible, onClose, onSubmit }: RateAppSheetProps) {
  return (
    // No title: just the close button, top right.
    <BottomSheet visible={visible} onClose={onClose} gap={18} scrollable headerLeft={<View />}>
      <RateForm onClose={onClose} onSubmit={onSubmit} />
    </BottomSheet>
  );
}

function RateForm({ onClose, onSubmit }: Omit<RateAppSheetProps, "visible">) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSaving(true);
    try {
      await onSubmit({ rating, comment: comment.trim() || undefined });
      // TODO: for 4-5 stars, offer the store review prompt (expo-store-review).
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <View style={styles.badge}>
        <Heart size={32} weight="fill" color={colors.primary} />
      </View>

      <View style={styles.text}>
        <Text style={styles.title}>Enjoying Srikandi Promil?</Text>
        <Text style={styles.subtitle}>
          Let us know how we’re doing — your feedback shapes what we build next.
        </Text>
      </View>

      <View style={styles.stars}>
        {STARS.map((n) => (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${n} star${n > 1 ? "s" : ""}`}
            accessibilityState={{ selected: n <= rating }}
            onPress={() => setRating(n)}
            hitSlop={4}
          >
            <Star size={34} weight="fill" color={n <= rating ? colors.warning : colors.border} />
          </Pressable>
        ))}
      </View>

      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Tell us what you love or what we can improve (optional)"
        placeholderTextColor={colors.inkFaint}
        multiline
        textAlignVertical="top"
        style={styles.textarea}
      />

      <ButtonPrimary label="Submit feedback" onPress={handleSubmit} disabled={rating === 0 || saving} style={styles.stretch} />
      <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
        <Text style={styles.later}>Maybe later</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { alignSelf: "stretch", alignItems: "center", gap: 18 },
  badge: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { alignItems: "center", gap: 6 },
  title: { fontFamily: fonts.bold, fontSize: 19, color: colors.ink, textAlign: "center" },
  subtitle: { width: 280, fontFamily: fonts.medium, fontSize: 13, color: colors.inkMuted, textAlign: "center" },
  stars: { flexDirection: "row", gap: 10 },
  textarea: {
    alignSelf: "stretch",
    height: 80,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
  },
  stretch: { alignSelf: "stretch" },
  later: { fontFamily: fonts.semibold, fontSize: 13, color: colors.inkFaint },
});
