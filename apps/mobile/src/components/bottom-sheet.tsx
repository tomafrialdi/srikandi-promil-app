import { X } from "phosphor-react-native";
import { useEffect, useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fonts, radius } from "@/constants/theme";

const ANIMATION_MS = 280;
const EASING = Easing.out(Easing.cubic);

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * App-wide bottom sheet: dimmed overlay + sheet that slides up to fit its content.
 * Use it for any modal content (date picker, log forms, confirmations, ...).
 */
export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  // Stay mounted while the exit animation plays.
  const [mounted, setMounted] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(windowHeight);
  const progress = useSharedValue(0);

  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    progress.set(withTiming(visible ? 1 : 0, { duration: ANIMATION_MS, easing: EASING }));
    if (visible) return;
    const timer = setTimeout(() => setMounted(false), ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [visible, progress]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.get(), [0, 1], [sheetHeight, 0]) }],
  }));

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.root}
      >
        <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityLabel="Close"
          />
        </Animated.View>

        <Animated.View
          onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 30) }, sheetStyle]}
        >
          <View style={styles.handle} />
          {title ? (
            <View style={styles.headRow}>
              <Text style={styles.title}>{title}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                style={styles.close}
              >
                <X size={16} color={colors.ink} />
              </Pressable>
            </View>
          ) : null}
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  overlay: { backgroundColor: colors.overlay },
  sheet: {
    alignItems: "center",
    gap: 20,
    paddingTop: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  headRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  close: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
});
