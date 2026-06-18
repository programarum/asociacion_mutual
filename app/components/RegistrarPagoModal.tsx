"use client";

import { useState, useMemo } from "react";
import { X, Loader2, CreditCard } from "lucide-react";
import { useCobertura } from "../../hooks/useCobertura";
import { useCreatePago } from "../../hooks/usePagos";

interface RegistrarPagoModalProps {
  asociadoId: number;
  asociadoNombre: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function RegistrarPagoModal({
  asociadoId,
  asociadoNombre,
  isOpen,
  onClose,
}: RegistrarPagoModalProps) {
  const { data, isLoading } = useCobertura({
    asociadoId,
    enabled: isOpen,
  });
  const createMutation = useCreatePago(asociadoId);

  const [meses, setMeses] = useState<number>(1);
  const [error, setError] = useState("");

  const maxMeses = data?.max_meses_pagables ?? 0;
  const cuotaMensual = data?.cuota_mensual ?? 0;
  const cuotaAdmin = data?.cuota_administracion ?? 0;
  const personas = data?.personas ?? 1;
  const beneficiariosCount = data?.beneficiarios_count ?? 0;
  const montoPorMes = data?.monto_por_mes ?? 0;
  const estado = data?.estado ?? "moroso";
  const mesPagadoHasta = data?.cobertura?.mes_pagado_hasta;

  const montoTotal = useMemo(
    () => (montoPorMes * meses).toFixed(2),
    [montoPorMes, meses]
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (maxMeses === 0) {
      setError(
        "No se pueden registrar más pagos este año (límite alcanzado)."
      );
      return;
    }

    if (meses < 1 || meses > maxMeses) {
      setError(`La cantidad de meses debe estar entre 1 y ${maxMeses}.`);
      return;
    }

    try {
      await createMutation.mutateAsync(meses);
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Error al registrar el pago");
    }
  };

  const formatDate = (d?: string | null) =>
    d ? d.split("T")[0] : "Sin registros";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-800">
              Registrar Pago — {asociadoNombre}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="py-8 text-center flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              <p className="text-gray-500">Cargando datos de cobertura...</p>
            </div>
          ) : (
            <>
              {/* Estado actual */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estado actual:</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      estado === "vigente"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {estado === "vigente" ? "Vigente" : "Moroso"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Mes pagado hasta:
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {formatDate(mesPagadoHasta)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Personas:</span>
                  <span className="text-sm font-medium text-gray-800">
                    {personas} (1 asociado + {beneficiariosCount} beneficiario
                    {beneficiariosCount !== 1 ? "s" : ""})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cuota mensual:</span>
                  <span className="text-sm font-medium text-gray-800">
                    ${cuotaMensual.toFixed(2)} / persona
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Cuota administración:
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    ${cuotaAdmin.toFixed(2)} / mes
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">
                    Subtotal por mes:
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    ${montoPorMes.toFixed(2)}
                  </span>
                </div>
              </div>

              {maxMeses === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Este asociado ya tiene la cobertura máxima para el año en
                    curso. No se pueden registrar más pagos hasta el próximo
                    año.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meses a pagar (máx. {maxMeses})
                    </label>
                    <select
                      value={meses}
                      onChange={(e) => setMeses(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from(
                        { length: maxMeses },
                        (_, i) => i + 1
                      ).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "mes" : "meses"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">
                        Total a pagar:
                      </span>
                      <span className="text-xl font-bold text-blue-800">
                        ${montoTotal}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-blue-600">
                      <p>
                        Cuota mensual: ${cuotaMensual.toFixed(2)} × {personas}{" "}
                        {personas === 1 ? "persona" : "personas"} = $
                        {(cuotaMensual * personas).toFixed(2)}
                      </p>
                      <p>
                        + Cuota administración: ${cuotaAdmin.toFixed(2)}
                      </p>
                      <p className="font-medium">
                        = ${montoPorMes.toFixed(2)} / mes
                      </p>
                      <p className="pt-1 border-t border-blue-200">
                        ${montoPorMes.toFixed(2)} × {meses}{" "}
                        {meses === 1 ? "mes" : "meses"} = ${montoTotal}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
                    >
                      {createMutation.isPending && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      Registrar pago
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
}
