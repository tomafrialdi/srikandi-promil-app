import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { FilterChips } from "@/components/filter-chips";
import { SearchField } from "@/components/form/search-field";
import { colors, fonts } from "@/constants/theme";
import { useSpecialists } from "../hooks/use-specialists";
import type { SpecialistFilter } from "../types";
import { MapPreview } from "./map-preview";
import { SpecialistCard } from "./specialist-card";

const FILTERS: { id: SpecialistFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ob-gyn", label: "OB-GYN" },
  { id: "fertility-clinic", label: "Fertility clinic" },
  { id: "open-now", label: "Open now" },
];

export function SpecialistsScreen() {
  const { query, setQuery, filter, setFilter, results } = useSpecialists();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.padded, styles.headRow]}>
          <BackButton />
          <Text style={styles.title}>Find a specialist</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.padded}>
          <SearchField value={query} onChange={setQuery} placeholder="Search clinics or doctors" />
        </View>

        <FilterChips options={FILTERS} value={filter} onChange={setFilter} size="md" />

        <View style={styles.padded}>
          <MapPreview pinCount={results?.length ?? 0} />
        </View>

        <View style={[styles.padded, styles.listHead]}>
          <Text style={styles.listTitle}>Nearby specialists</Text>
          {results ? <Text style={styles.count}>{results.length} found</Text> : null}
        </View>

        <View style={[styles.padded, styles.list]}>
          {results?.map((s) => (
            <SpecialistCard
              key={s.id}
              specialist={s}
              onPress={
                s.kind === "clinic"
                  ? () => router.push({ pathname: "/specialists/[id]", params: { id: s.id } })
                  : undefined // TODO: doctor profile screen (no design yet).
              }
            />
          ))}
          {results && results.length === 0 ? (
            <Text style={styles.empty}>No specialists match your search.</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { gap: 20, paddingTop: 8, paddingBottom: 32 },
  padded: { paddingHorizontal: 20 },
  headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  spacer: { width: 40, height: 40 },
  listHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  listTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  count: { fontFamily: fonts.semibold, fontSize: 12, color: colors.inkFaint },
  list: { gap: 12 },
  empty: { textAlign: "center", fontFamily: fonts.medium, fontSize: 13, color: colors.inkMuted, paddingVertical: 24 },
});
