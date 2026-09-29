import dummy from "../data/logging-data.json";
import type { LoggingData, SaveLogInput } from "../types";
import type { LoggingApi } from "./logging-api";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const dummyLoggingApi: LoggingApi = {
  async getData() {
    await delay(200);
    return dummy as LoggingData;
  },
  async save(input: SaveLogInput) {
    await delay(300);
    console.log("[logging] save", JSON.stringify(input));
  },
};
