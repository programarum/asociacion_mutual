import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

const UPDATE_ENDPOINT =
  "https://github.com/programarum/asociacion_mutual/releases/latest/download/latest.json";

interface UpdateInfo {
  version: string;
  url: string;
  notes?: string;
}

interface UpdateCheckResult {
  available: boolean;
  update?: UpdateInfo;
}

function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/i, "").split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.replace(/^v/i, "").split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function useUpdateCheck(): UpdateCheckResult {
  const [state, setState] = useState<UpdateCheckResult>({ available: false });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [installed, remote] = await Promise.all([
          invoke<string>("get_app_version"),
          fetch(UPDATE_ENDPOINT).then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json() as Promise<UpdateInfo>;
          }),
        ]);
        if (cancelled) return;
        if (compareVersions(remote.version, installed) > 0) {
          setState({ available: true, update: remote });
        }
      } catch {
        if (!cancelled) setState({ available: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}