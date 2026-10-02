import { ArrowsClockwise } from "phosphor-react-native";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

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

const failureMessage = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong. Please try again.";

export function ConnectedDevicesScreen() {
  const { data, error, busyId, connect, disconnect, setPreference } = useDevices();

  const handleConnect = (device: Device) =>
    connect(device.id).catch((e) => Alert.alert(`Couldn't connect ${device.name}`, failureMessage(e)));

  const handleDisconnect = (device: Device) =>
    Alert.alert(`Disconnect ${device.name}?`, "We'll stop using it. You can reconnect any time.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect",
        style: "destructive",
        onPress: () =>
          disconnect(device.id).catch((e) => Alert.alert(`Couldn't disconnect ${device.name}`, failureMessage(e))),
      },
    ]);

  return (
    <StickyScreen header={<ScreenHeader title="Connected devices" />}>
        {error && !data ? <Text style={styles.hint}>{"Couldn't load your devices. Go back and try again."}</Text> : null}

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

            {data.connected.length > 0 ? (
              <>
                <SectionHeader title="Connected" />
                <InsetList>
                  {data.connected.map((device) => (
                    <DeviceRow
                      key={device.id}
                      device={device}
                      onPress={() => handleDisconnect(device)}
                      trailing={<Chip label={busyId === device.id ? "Working…" : "Connected"} tone="success" />}
                    />
                  ))}
                </InsetList>
                <Text style={styles.hint}>
                  Access is saved. Importing readings automatically arrives with temperature logging in an
                  upcoming update. Tap a device to disconnect it.
                </Text>
              </>
            ) : null}

            {data.available.length > 0 ? (
              <>
                <SectionHeader title="Available" />
                <InsetList>
                  {data.available.map((device) => (
                    <DeviceRow
                      key={device.id}
                      device={device}
                      trailing={
                        device.comingSoon ? (
                          <Chip label="Soon" tone="neutral" />
                        ) : (
                          <ConnectButton busy={busyId === device.id} onPress={() => handleConnect(device)} />
                        )
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

function DeviceRow({
  device,
  trailing,
  onPress,
}: {
  device: Device;
  trailing: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={styles.device}
    >
      <IconCircle icon={DEVICE_ICONS[device.icon]} size={38} />
      <View style={styles.deviceText}>
        <Text style={styles.deviceName}>{device.name}</Text>
        <Text style={styles.deviceDescription}>{device.description}</Text>
      </View>
      {trailing}
    </Pressable>
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
  hint: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: colors.inkMuted },
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
