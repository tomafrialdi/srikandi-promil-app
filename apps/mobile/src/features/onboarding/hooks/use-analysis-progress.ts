import { useEffect, useState } from "react";

import type { LoadingTask } from "../types";

/**
 * Walks through the loading tasks one by one.
 * `activeIndex === tasks.length` means everything is done.
 * TODO(backend): drive this from real analysis status instead of timers.
 */
export function useAnalysisProgress(tasks: LoadingTask[]) {
  const [activeIndex, setActiveIndex] = useState(0);
  const done = activeIndex >= tasks.length;

  useEffect(() => {
    if (done) return;
    const timer = setTimeout(() => setActiveIndex((i) => i + 1), tasks[activeIndex].durationMs);
    return () => clearTimeout(timer);
  }, [activeIndex, done, tasks]);

  return { activeIndex, done };
}
