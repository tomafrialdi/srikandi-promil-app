import type { ReactNode } from "react";
import { View } from "react-native";

/** Stretches a sheet's content to full width with a vertical rhythm (default 20px). */
export function SheetContent({ gap = 20, children }: { gap?: number; children: ReactNode }) {
  return <View style={{ alignSelf: "stretch", gap }}>{children}</View>;
}
