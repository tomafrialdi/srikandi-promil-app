import { useLocalSearchParams } from "expo-router";

import { SpecialistDetailScreen } from "@/features/specialists/components/specialist-detail-screen";

export default function SpecialistDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SpecialistDetailScreen id={id} />;
}
