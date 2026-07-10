import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ShieldCheck, Copy, Check, Loader2, AlertTriangle } from "lucide-react";

interface LicenseStatus {
  valid: boolean;
  machine_id: string;
  needs_activation: boolean;
}

export default function ActivacionPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [machineId, setMachineId] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [error, setError] = useState("");
  const [activating, setActivating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    invoke<LicenseStatus>("verify_license")
      .then((status) => {
        if (status.valid) {
          navigate("/dashboard");
        } else {
          setMachineId(status.machine_id);
        }
      })
      .catch(() => {
        setError("Error al verificar la licencia");
      })
      .finally(() => {
        setChecking(false);
      });
  }, [navigate]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(machineId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = machineId;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setActivating(true);

    try {
      const result = await invoke<LicenseStatus>("activate_license", {
        licenseKey: licenseKey.trim(),
      });
      if (result.valid) {
        navigate("/dashboard");
      } else {
        setError("La clave de licencia no es válida para este equipo");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Error al activar la licencia");
    }

    setActivating(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-linear-to-br from-stone-900 via-slate-800 to-stone-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p>Verificando licencia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-stone-900 via-slate-800 to-stone-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          <div className="bg-linear-to-r from-amber-600 to-amber-700 px-8 py-10 text-center">
            <ShieldCheck className="w-12 h-12 text-white mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-white">Activación de Licencia</h1>
            <p className="text-amber-100 mt-1">Asociación Mutual El Rosario</p>
          </div>

          <div className="px-8 py-8">
            <p className="text-sm text-gray-600 mb-4">
              Esta aplicación requiere una licencia válida para funcionar.
              Copie el código de equipo y envíelo al administrador para obtener
              su clave de activación.
            </p>

            {/* Machine ID */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de equipo
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={machineId}
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-700 outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors flex items-center gap-2"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* License Key Input */}
            <form onSubmit={handleActivate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clave de activación
                </label>
                <input
                  type="text"
                  required
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="Ingrese la clave proporcionada por el administrador"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-700 outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={activating}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={activating || !licenseKey.trim()}
                className="w-full bg-linear-to-r from-amber-600 to-amber-700 text-white font-semibold py-2.5 rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activating ? "Activando..." : "Activar licencia"}
              </button>
            </form>
          </div>

          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Si necesita una nueva licencia, contacte al administrador del
              sistema con el código de equipo mostrado arriba.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
