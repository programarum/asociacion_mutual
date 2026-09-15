import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

const UPDATE_ENDPOINT =
  "https://github.com/programarum/asociacion_mutual/releases/latest/download/latest.json";

interface UpdateInfo {
  version: string;
  url: string;
  notes?: string;
}

interface UpdaterManifest {
  version?: string;
  notes?: string;
  pub_date?: string;
  platforms?: {
    "windows-x86_64"?: {
      signature?: string;
      url?: string;
    };
    [key: string]: unknown;
  };
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
        const [installed, manifest] = await Promise.all([
          invoke<string>("get_app_version"),
          fetch(UPDATE_ENDPOINT).then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json() as Promise<UpdaterManifest>;
          }),
        ]);

        const platform = manifest.platforms?.["windows-x86_64"];
        const remote = manifest.version ?? "";
        if (platform?.url && remote) {
          const available = compareVersions(remote, installed) > 0;
          if (available && !cancelled) {
            setState({
              available: true,
              update: {
                version: remote,
                url: platform.url,
                notes: manifest.notes,
              },
            });
          }
        }
      } catch {
        // Sin conexion o manifiesto no publicado: no molestar.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
