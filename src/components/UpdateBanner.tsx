import { useState } from "react";
import { Download, Loader2, RefreshCw, X } from "lucide-react";
import { relaunch } from "@tauri-apps/plugin-process";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useUpdateCheck } from "../hooks/useUpdateCheck";

type InstallStatus =
  | { status: "idle" }
  | { status: "downloading"; downloaded: number; total: number | null }
  | { status: "installing" }
  | { status: "error"; message: string };

export default function UpdateBanner() {
  const { available, update } = useUpdateCheck();
  const [dismissed, setDismissed] = useState(false);
  const [install, setInstall] = useState<InstallStatus>({ status: "idle" });

  if (!available || dismissed || !update) return null;

  const handleInstall = async () => {
    if (install.status === "downloading" || install.status === "installing") return;
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const pending = await check();
      if (!pending?.version) {
        await openUrl(update.url);
        return;
      }
      setInstall({ status: "downloading", downloaded: 0, total: null });
      await pending.downloadAndInstall((event) => {
        if (event.event === "Started") {
          setInstall({
            status: "downloading",
            downloaded: 0,
            total: event.data.contentLength ?? null,
          });
        } else if (event.event === "Progress") {
          setInstall((prev) =>
            prev.status === "downloading"
              ? { ...prev, downloaded: prev.downloaded + event.data.chunkLength }
              : prev,
          );
        }
      });
      setInstall({ status: "installing" });
      await relaunch();
    } catch (err) {
      console.error("Error al instalar actualizacion:", err);
      setInstall({ status: "error", message: String(err) });
    }
  };

  const pct =
    install.status === "downloading" && install.total
      ? Math.min(100, Math.round((install.downloaded / install.total) * 100))
      : null;

  return (
    <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-amber-900 min-w-0">
        {install.status === "downloading" || install.status === "installing" ? (
          <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
        ) : (
          <Download className="w-4 h-4 shrink-0" />
        )}
        <span className="truncate">
          {install.status === "error" ? (
            <span className="text-red-700">Error al instalar: {install.message}</span>
          ) : install.status === "downloading" ? (
            `Descargando actualización en segundo plano… ${pct ? `${pct}%` : ""}`
          ) : install.status === "installing" ? (
            "Instalando actualización… No cierres la aplicación."
          ) : (
            <>
              Hay una nueva versión disponible:{" "}
              <strong>v{update.version}</strong>
              {update.notes ? ` — ${update.notes}` : ""}
            </>
          )}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {install.status === "downloading" && (
          <div className="w-36 h-1.5 rounded bg-amber-200 overflow-hidden">
            <div
              className="h-full bg-amber-600 transition-all"
              style={{ width: `${pct ?? 10}%` }}
            />
          </div>
        )}
        <button
          onClick={handleInstall}
          disabled={install.status === "downloading" || install.status === "installing"}
          className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          {install.status === "downloading" || install.status === "installing" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {install.status === "downloading"
            ? "Descargando…"
            : install.status === "installing"
              ? "Instalando…"
              : "Actualizar ahora"}
        </button>
        {install.status === "error" && (
          <button
            onClick={() => setInstall({ status: "idle" })}
            className="text-xs text-amber-700 underline"
          >
            Reintentar
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          disabled={install.status === "downloading" || install.status === "installing"}
          className="p-1 rounded text-amber-700 hover:bg-amber-200 transition-colors"
          aria-label="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
