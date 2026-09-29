import { ArrowsClockwise } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Chip } from "@/components/chip";
import { IconCircle } from "@/components/icon-circle";
import { InsetList } from "@/components/list/inset-list";
import { InsetToggleItem } from "@/components/list/inset-toggle-item";
import { ScreenHeader } from "@/components/screen-header";
import { StickyScreen } from "@/components/sticky-screen";
import { SectionHeader } from "@/components/section-header";
import { colors, fonts, radius } from "@/constants/theme";
import { useDevices } from "../hooks/use-devices";
import { DEVICE_ICONS } from "../icons";
import type { Device } from "../types";

export function ConnectedDevicesScreen() {
  const { data, connectingId, connect, setPreference } = useDevices();

  return (
    <StickyScreen header={<ScreenHeader title="Connected devices" />}>

        {data ? (
          <>
            {data.syncSummary ? (
              <View style={styles.sync}>
                <View style={styles.syncIcon}>
                  <ArrowsClockwise size={18} color={colors.success} />
                </View>
                <View style={styles.syncText}>
                  <Text style={styles.syncTitle}>{data.syncSummary.title}</Text>
                  <Text style={styles.syncDescription}>{data.syncSummary.description}</Text>
                </View>
              </View>
            ) : null}

            <SectionHeader title="Connected" />
            <InsetList>
              {data.connected.map((device) => (
                <DeviceRow key={device.id} device={device} trailing={<Chip label="Connected" tone="success" />} />
              ))}
            </InsetList>

            {data.available.length > 0 ? (
              <>
                <SectionHeader title="Available" />
                <InsetList>
                  {data.available.map((device) => (
                    <DeviceRow
                      key={device.id}
                      device={device}
                      trailing={
                        <ConnectButton busy={connectingId === device.id} onPress={() => connect(device.id)} />
                      }
                    />
                  ))}
                </InsetList>
              </>
            ) : null}

            <SectionHeader title="Preferences" />
            <InsetList>
              <InsetToggleItem
                label="Auto-import temperature"
                value={data.preferences.autoImportTemperature}
                onValueChange={(v) => setPreference("autoImportTemperature", v)}
              />
              <InsetToggleItem
                label="Ask before overwriting manual logs"
                value={data.preferences.askBeforeOverwrite}
                onValueChange={(v) => setPreference("askBeforeOverwrite", v)}
              />
            </InsetList>
          </>
        ) : null}
    </StickyScreen>
  );
}

function DeviceRow({ device, trailing }: { device: Device; trailing: React.ReactNode }) {
  return (
    <View style={styles.device}>
      <IconCircle icon={DEVICE_ICONS[device.icon]} size={38} />
      <View style={styles.deviceText}>
        <Text style={styles.deviceName}>{device.name}</Text>
        <Text style={styles.deviceDescription}>{device.description}</Text>
      </View>
      {trailing}
    </View>
  );
}

function ConnectButton({ busy, onPress }: { busy: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={busy}
      onPress={onPress}
      style={[styles.connect, busy && styles.connectBusy]}
    >
      <Text style={styles.connectLabel}>{busy ? "Connecting…" : "Connect"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sync: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.successSoft,
  },
  syncIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  syncText: { flex: 1, gap: 2 },
  syncTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.success },
  syncDescription: { fontFamily: fonts.medium, fontSize: 11, color: colors.success },
  device: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  deviceText: { flex: 1, gap: 2 },
  deviceName: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  deviceDescription: { fontFamily: fonts.medium, fontSize: 11, color: colors.inkMuted },
  connect: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  connectBusy: { opacity: 0.5 },
  connectLabel: { fontFamily: fonts.bold, fontSize: 11, color: colors.primary },
});
