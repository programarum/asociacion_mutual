import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import {
  useConfiguracion,
  useUpdateConfiguracion,
} from "../hooks/useConfiguracion";

export default function SettingPage() {
  const { data, isLoading } = useConfiguracion();
  const updateMutation = useUpdateConfiguracion();

  const [cuota, setCuota] = useState("");
  const [cuotaAdmin, setCuotaAdmin] = useState("");
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (data) {
      setCuota(String(data.cuota_mensual));
      setCuotaAdmin(String(data.cuota_administracion));
    }
  }, [data]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valorCuota = parseFloat(cuota);
    const valorAdmin = parseFloat(cuotaAdmin);

    if (isNaN(valorCuota) || valorCuota < 0) {
      setMessage({ text: "La cuota mensual no es válida", type: "error" });
      return;
    }
    if (isNaN(valorAdmin) || valorAdmin < 0) {
      setMessage({
        text: "La cuota de administración no es válida",
        type: "error",
      });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        cuota_mensual: valorCuota,
        cuota_administracion: valorAdmin,
      });
      setMessage({
        text: "Configuración actualizada exitosamente",
        type: "success",
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMessage({
        text: e.response?.data?.message || "Error al actualizar la configuración",
        type: "error",
      });
    }
  };

  return (
    <>
      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg border ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        <p className="text-gray-600 mb-6">
          Parámetros globales del sistema de cuotas y coberturas.
        </p>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            <p className="text-gray-500">Cargando configuración...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 max-w-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Cuotas del Sistema
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              El monto mensual de cada asociado se calcula así:{" "}
              <strong>
                (cuota mensual × n° de personas) + cuota administración
              </strong>
              , donde el n° de personas incluye al asociado y cada uno de sus
              beneficiarios. La cuota de administración es un cargo fijo por mes
              que no se multiplica.
            </p>

            <div className="p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Ejemplo:</strong> asociado + 3 beneficiarios = 4
                personas. Con cuota mensual $4.500 y administración $1.000:{" "}
                <br />
                (4.500 × 4) + 1.000 = <strong>$19.000 / mes</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cuota mensual (por persona)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={cuota}
                  onChange={(e) => setCuota(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cuota de administración (fija por mes)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={cuotaAdmin}
                  onChange={(e) => setCuotaAdmin(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </>
  );
}
