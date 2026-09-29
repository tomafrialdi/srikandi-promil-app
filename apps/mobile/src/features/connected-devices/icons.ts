import { Heartbeat, Pulse, RadioButton, TestTube, Thermometer, Watch, type Icon } from "phosphor-react-native";

import type { DeviceIconName } from "./types";

export const DEVICE_ICONS: Record<DeviceIconName, Icon> = {
  ring: RadioButton,
  "heart-pulse": Heartbeat,
  thermometer: Thermometer,
  "test-tube": TestTube,
  pulse: Pulse,
  watch: Watch,
};
