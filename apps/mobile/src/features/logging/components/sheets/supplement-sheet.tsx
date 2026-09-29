import { Check, Flask, Pill, Star } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ButtonPrimary } from "@/components/button-primary";
import { LinkButton } from "@/components/link-button";
import { colors, fonts, radius } from "@/constants/theme";
import { LOG_COPY } from "../../content";
import { useLogging } from "../../context/logging-context";
import type { SupplementCatalog, SupplementKind, SupplementProduct } from "../../types";
import { SheetContent } from "../parts/sheet-content";

const copy = LOG_COPY.supplement;

/** Product picker shared by "Prenatal vitamin" and "Folic acid": only the catalog differs. */
export function SupplementSheet({
  category,
  catalog,
}: {
  category: SupplementKind;
  catalog: SupplementCatalog;
}) {
  const { save } = useLogging();
  const [productId, setProductId] = useState(catalog.defaultProductId);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await save({ kind: "supplement", category, productId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetContent gap={16}>
      <View style={styles.list}>
        {catalog.products.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            icon={catalog.icon}
            selected={product.id === productId}
            onPress={() => setProductId(product.id)}
          />
        ))}
      </View>

      <ButtonPrimary label={copy.save} onPress={handleSave} disabled={saving} />
      {/* TODO: open the supplement comparison screen. */}
      <LinkButton label={copy.compare} />
    </SheetContent>
  );
}

function ProductRow({
  product,
  icon,
  selected,
  onPress,
}: {
  product: SupplementProduct;
  icon: SupplementCatalog["icon"];
  selected: boolean;
  onPress: () => void;
}) {
  const ProductIcon = icon === "flask" ? Flask : Pill;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.row, selected && styles.rowSelected]}
    >
      <View style={styles.image}>
        <ProductIcon size={24} color={colors.info} />
      </View>

      <View style={styles.text}>
        {product.recommended ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{copy.recommended}</Text>
          </View>
        ) : null}
        <Text style={styles.name}>{product.name}</Text>
        <View style={styles.meta}>
          <Star size={12} weight="fill" color={colors.warning} />
          <Text style={styles.rating}>
            {product.rating} ({product.reviews})
          </Text>
          <Text style={styles.price}>· {product.price}</Text>
        </View>
      </View>

      <View style={[styles.check, selected && styles.checkSelected]}>
        {selected ? <Check size={14} weight="bold" color={colors.white} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  rowSelected: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primarySoft },
  image: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: 4 },
  badge: {
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 9, color: colors.white },
  name: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  meta: { flexDirection: "row", alignItems: "center", gap: 5 },
  rating: { fontFamily: fonts.semibold, fontSize: 11, color: colors.inkMuted },
  price: { fontFamily: fonts.bold, fontSize: 11, color: colors.ink },
  check: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  checkSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
});
