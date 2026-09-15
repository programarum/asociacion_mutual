import { useState } from "react";
import { Download, X } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useUpdateCheck } from "../hooks/useUpdateCheck";

export default function UpdateBanner() {
  const { available, update } = useUpdateCheck();
  const [dismissed, setDismissed] = useState(false);

  if (!available || dismissed || !update) return null;

  const handleDownload = async () => {
    try {
      await openUrl(update.url);
    } catch {
      window.open(update.url, "_blank");
    }
  };

  return (
    <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-amber-900 min-w-0">
        <Download className="w-4 h-4 shrink-0" />
        <span className="truncate">
          Hay una nueva versión disponible:{" "}
          <strong>v{update.version}</strong>
          {update.notes ? ` — ${update.notes}` : ""}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleDownload}
          className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
        >
          Descargar
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded text-amber-700 hover:bg-amber-200 transition-colors"
          aria-label="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}