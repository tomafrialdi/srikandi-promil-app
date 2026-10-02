import { Image } from "expo-image";
import { ArrowRight, X } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";
import { ikUrl } from "@/lib/imagekit";
import type { ContentCard } from "../types";

interface InAppCardProps {
  card: ContentCard;
  onOpen: () => void;
  onDismiss: () => void;
}

/** One in-app card from the Content library; its look follows the layout chosen in the console. */
export function InAppCard({ card, onOpen, onDismiss }: InAppCardProps) {
  const actionable = !!card.deepLink;
  const image = ikUrl(card.imageUrl, { w: 800 });

  // `bottom_sheet` has no sheet treatment yet: it renders like a hero card.
  if (card.layout === "banner" || card.layout === "inline_list") {
    return (
      <Pressable
        accessibilityRole={actionable ? "button" : undefined}
        disabled={!actionable}
        onPress={onOpen}
        style={[styles.compact, card.layout === "inline_list" && styles.inline]}
      >
        <View style={styles.compactText}>
          <Text style={styles.title}>{card.title}</Text>
          {card.body ? <Text style={styles.body}>{card.body}</Text> : null}
          {actionable && card.ctaLabel ? <Text style={styles.cta}>{card.ctaLabel}</Text> : null}
        </View>
        {actionable ? <ArrowRight size={16} color={colors.primary} /> : null}
        {card.dismissible ? <Dismiss onPress={onDismiss} /> : null}
      </Pressable>
    );
  }

  return (
    <View style={styles.hero}>
      {image ? <Image source={{ uri: image }} contentFit="cover" style={styles.heroImage} /> : null}
      <View style={styles.heroBody}>
        <Text style={styles.title}>{card.title}</Text>
        {card.body ? <Text style={styles.body}>{card.body}</Text> : null}
        {actionable && card.ctaLabel ? (
          <Pressable accessibilityRole="button" onPress={onOpen} style={styles.button}>
            <Text style={styles.buttonText}>{card.ctaLabel}</Text>
            <ArrowRight size={12} color={colors.white} />
          </Pressable>
        ) : null}
      </View>
      {card.dismissible ? <Dismiss onPress={onDismiss} floating /> : null}
    </View>
  );
}

function Dismiss({ onPress, floating }: { onPress: () => void; floating?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Dismiss"
      hitSlop={10}
      onPress={onPress}
      style={floating ? styles.dismissFloating : undefined}
    >
      <X size={14} color={colors.inkMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  compact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
  },
  inline: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  compactText: { flex: 1, gap: 2 },
  hero: {
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  heroImage: { width: "100%", height: 130, backgroundColor: colors.surfaceAlt },
  heroBody: { gap: 6, padding: 16 },
  title: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  body: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: colors.inkMuted },
  cta: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
  button: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  buttonText: { fontFamily: fonts.bold, fontSize: 12, color: colors.white },
  dismissFloating: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
});
