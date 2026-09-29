import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { ButtonOutline } from "@/components/button-outline";
import { ButtonPrimary } from "@/components/button-primary";
import { colors, fonts } from "@/constants/theme";
import { callPhone, openWhatsApp } from "@/utils/external-links";
import { useSpecialistDetail } from "../hooks/use-specialists";
import { BpjsCard } from "./detail/bpjs-card";
import { CostList } from "./detail/cost-list";
import { DetailCover } from "./detail/detail-cover";
import { DetailHeader } from "./detail/detail-header";
import { DoctorsList } from "./detail/doctors-list";
import { ReviewCard } from "./detail/review-card";

export function SpecialistDetailScreen({ id }: { id: string }) {
  const { detail, error } = useSpecialistDetail(id);
  const insets = useSafeAreaInsets();

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorHead}>
          <BackButton />
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>We couldn’t find this clinic.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!detail) return <View style={styles.safe} />;

  return (
    <View style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <DetailCover imageUrl={detail.coverImageUrl} shareMessage={`${detail.name} on Srikandi Promil`} />

        <View style={styles.content}>
          <DetailHeader detail={detail} />
          {detail.bpjs ? <BpjsCard bpjs={detail.bpjs} /> : null}
          <CostList costs={detail.costs} note={detail.costNote} />
          {/* TODO: doctor list / profile screens (no design yet). */}
          <DoctorsList doctors={detail.doctors} />
          {detail.review ? <ReviewCard review={detail.review} /> : null}
        </View>
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <ButtonOutline label="Call" style={styles.action} onPress={() => callPhone(detail.phone)} />
        <ButtonPrimary
          label="Book via WA"
          style={styles.action}
          onPress={() => openWhatsApp(detail.whatsapp, `Hi ${detail.name}, I'd like to book an appointment.`)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingBottom: 24 },
  content: { gap: 20, paddingTop: 20, paddingHorizontal: 20 },
  actionBar: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  action: { flex: 1 },
  errorHead: { paddingTop: 8, paddingHorizontal: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontFamily: fonts.medium, fontSize: 14, color: colors.inkMuted },
});
