import * as WebBrowser from "expo-web-browser";
import { router, type Href } from "expo-router";
import { useCallback } from "react";

import { useOptionalLogging } from "@/features/logging/context/logging-context";
import { parseDeepLink } from "../utils/deep-link";

/**
 * Opens a link from the Content library. Log links open the log sheet right away when the user
 * is inside the app tabs; from other screens they go to Home, which opens it (`?open=<kind>`).
 */
export function useOpenLink() {
  const logging = useOptionalLogging();

  return useCallback(
    (url: string) => {
      const target = parseDeepLink(url);
      if (!target) return;

      if (target.type === "log") {
        if (logging) logging.openLog(target.kind);
        else router.navigate({ pathname: "/home", params: { open: target.kind } });
      } else if (target.type === "route") {
        router.push(target.href as Href);
      } else {
        WebBrowser.openBrowserAsync(target.url);
      }
    },
    [logging],
  );
}
