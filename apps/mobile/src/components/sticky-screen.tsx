import { useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { colors } from "@/constants/theme";

const SIDE_PADDING = 20;

interface StickyScreenProps {
  /** Pinned at the top: back button, title, search box, filters ... Only `children` scrolls. */
  header: ReactNode;
  /** Scrolling content. */
  children: ReactNode;
  /** Pinned at the bottom (e.g. a primary button bar). It handles its own bottom inset. */
  footer?: ReactNode;
  /** Safe-area edges to respect. Tab screens use ["top"] and set `bottomPadding` instead. */
  edges?: Edge[];
  /** Extra space at the end of the scroll content (e.g. the floating tab bar's height). Default 32. */
  bottomPadding?: number;
  /** Space between stacked header pieces. Default 14. */
  headerGap?: number;
  /** Merged into the scroll content style: override `gap`, or set `paddingHorizontal: 0` for full-bleed sections. */
  contentStyle?: StyleProp<ViewStyle>;
  /** Moves the whole screen above the keyboard (forms). */
  keyboardAvoiding?: boolean;
}

/**
 * Screen layout with a pinned header. A hairline appears under the header once
 * the content scrolls beneath it.
 */
export function StickyScreen({
  header,
  children,
  footer,
  edges = ["top", "bottom"],
  bottomPadding = 32,
  headerGap = 14,
  contentStyle,
  keyboardAvoiding,
}: StickyScreenProps) {
  const [scrolled, setScrolled] = useState(false);

  const body = (
    <>
      <View style={[styles.header, { gap: headerGap }, scrolled && styles.headerScrolled]}>{header}</View>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 2)}
      >
        {children}
      </ScrollView>
      {footer}
    </>
  );

  return (
    <SafeAreaView edges={edges} style={styles.safe}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

/** Lets a header piece (e.g. a scrolling chip row) run edge to edge inside the padded header. */
export function StickyBleed({ children }: { children: ReactNode }) {
  return <View style={styles.bleed}>{children}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  header: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: SIDE_PADDING,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
    backgroundColor: colors.surface,
  },
  headerScrolled: { borderBottomColor: colors.border },
  content: { gap: 20, paddingTop: 8, paddingHorizontal: SIDE_PADDING },
  bleed: { marginHorizontal: -SIDE_PADDING },
});
