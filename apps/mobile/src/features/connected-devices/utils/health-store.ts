import { NativeModules, Platform, TurboModuleRegistry } from "react-native";

/** A failure the user can act on (shown as-is in an alert). */
export class HealthStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HealthStoreError";
  }
}

export interface HealthAccess {
  /** Short text stored with the connection, e.g. "iOS · temperature, cycle". */
  note: string;
}

const MISSING_MODULE =
  "Health access isn't included in this version of the app. Please update the app and try again.";

/**
 * Asks the phone's health store (Apple Health on iOS, Health Connect on Android) for read access
 * to basal body temperature and menstrual data. Resolves once access was granted; throws a
 * `HealthStoreError` when it can't be. The native modules are loaded lazily so an app build
 * without them degrades to a message instead of crashing at startup.
 */
export async function requestHealthAccess(): Promise<HealthAccess> {
  return Platform.OS === "ios" ? requestAppleHealth() : requestHealthConnect();
}

/** The library registers as a TurboModule (new architecture) or a classic native module. */
function hasHealthConnectModule(): boolean {
  return NativeModules.HealthConnect != null || TurboModuleRegistry.get("HealthConnect") != null;
}

async function requestAppleHealth(): Promise<HealthAccess> {
  // Check the native side first: requiring the library without it makes Metro report a fatal
  // error even inside a try/catch, so an old dev build would show a red screen.
  if (TurboModuleRegistry.get("NitroModules") == null) throw new HealthStoreError(MISSING_MODULE);

  let healthKit: typeof import("@kingstinct/react-native-healthkit");
  try {
    // Lazy on purpose: a build without the native module must not crash at startup.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    healthKit = require("@kingstinct/react-native-healthkit");
  } catch {
    throw new HealthStoreError(MISSING_MODULE);
  }

  if (!(await healthKit.isHealthDataAvailableAsync())) {
    throw new HealthStoreError("Apple Health isn't available on this device.");
  }
  // iOS never reveals whether *read* access was granted, so "connected" means "the user was asked".
  await healthKit.requestAuthorization({
    toRead: ["HKQuantityTypeIdentifierBasalBodyTemperature", "HKCategoryTypeIdentifierMenstrualFlow"],
  });
  return { note: "iOS · temperature, cycle" };
}

async function requestHealthConnect(): Promise<HealthAccess> {
  if (!hasHealthConnectModule()) throw new HealthStoreError(MISSING_MODULE);

  let healthConnect: typeof import("react-native-health-connect");
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    healthConnect = require("react-native-health-connect");
  } catch {
    throw new HealthStoreError(MISSING_MODULE);
  }

  const status = await healthConnect.getSdkStatus();
  if (status === healthConnect.SdkAvailabilityStatus.SDK_UNAVAILABLE) {
    throw new HealthStoreError("Health Connect isn't supported on this device.");
  }
  if (status === healthConnect.SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
    throw new HealthStoreError("Please install or update Health Connect from Google Play, then try again.");
  }
  if (!(await healthConnect.initialize())) {
    throw new HealthStoreError("Couldn't start Health Connect. Please try again.");
  }

  const granted = await healthConnect.requestPermission([
    { accessType: "read", recordType: "BasalBodyTemperature" },
    { accessType: "read", recordType: "MenstruationPeriod" },
  ]);
  const types = granted.map((p) => ("recordType" in p ? p.recordType : null));
  if (!types.includes("BasalBodyTemperature")) {
    throw new HealthStoreError("Permission wasn't granted. You can allow it in Health Connect settings.");
  }
  return { note: types.includes("MenstruationPeriod") ? "Android · temperature, cycle" : "Android · temperature" };
}
