import type { ReactNode } from "react";
import { View } from "react-native";

/** Stretches a sheet's content to full width with the standard 20px rhythm. */
export function SheetContent({ children }: { children: ReactNode }) {
  return <View style={{ alignSelf: "stretch", gap: 20 }}>{children}</View>;
}
