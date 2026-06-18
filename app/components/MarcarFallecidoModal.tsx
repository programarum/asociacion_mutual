"use client";

import { useState } from "react";
import { X, Loader2, AlertTriangle, UserCog } from "lucide-react";
import {
  useBeneficiarios,
} from "../../hooks/useBeneficiarios";
import { useMarcarAsociadoFallecido } from "../../hooks/useFallecidos";

interface MarcarFallecidoModalProps {
  asociadoId: number;
  asociadoNombre: string;
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

export default function MarcarFallecidoModal({
  asociadoId,
  asociadoNombre,
  isOpen,
  onClose,
  onCompleted,
}: MarcarFallecidoModalProps) {
  const { data, isLoading } = useBeneficiarios({
    asociadoId,
    enabled: isOpen,
  });
  const mutation = useMarcarAsociadoFallecido();

  const [selectedBeneficiario, setSelectedBeneficiario] =
    useState<number | null>(null);
  const [fechaFallecimiento, setFechaFallecimiento] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const beneficiarios = data?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fechaFallecimiento) {
      setError("Debe ingresar la fecha de fallecimiento");
      return;
    }

    if (beneficiarios.length > 0 && !selectedBeneficiario) {
      setError(
        "Este asociado tiene beneficiarios. Debe seleccionar uno para promocionarlo a titular."
      );
      return;
    }

    try {
      if (beneficiarios.length > 0 && selectedBeneficiario) {
        await mutation.mutateAsync({
          asociadoId,
          beneficiarioId: selectedBeneficiario,
          fechaFallecimiento,
        });
      }
      onCompleted();
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(
        e.response?.data?.message || "Error al marcar como fallecido"
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-800">
              Marcar Fallecido — {asociadoNombre}
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              Al marcar un asociado como fallecido, se registra su defunción en
              el historial. Si tiene beneficiarios, debe seleccionar uno para
              que asuma el rol de titular (hereda los datos de contacto y los
              pagos).
            </p>
          </div>

          {/* Fecha de fallecimiento */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de fallecimiento *
            </label>
            <input
              type="date"
              required
              value={fechaFallecimiento}
              onChange={(e) => setFechaFallecimiento(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Beneficiarios */}
          {isLoading ? (
            <div className="py-8 text-center flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              <p className="text-gray-500">Cargando beneficiarios...</p>
            </div>
          ) : beneficiarios.length > 0 ? (
            <>
              <h4 className="font-semibold text-gray-700 mb-3">
                Selecciona el beneficiario que será el nuevo titular:
              </h4>
              <div className="space-y-2 mb-6">
                {beneficiarios.map((b) => (
                  <label
                    key={b.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedBeneficiario === b.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="beneficiario"
                      checked={selectedBeneficiario === b.id}
                      onChange={() => setSelectedBeneficiario(b.id)}
                      className="w-4 h-4"
                    />
                    <UserCog className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {b.primer_nombre} {b.segundo_nombre || ""}{" "}
                        {b.primer_apellido} {b.segundo_apellido || ""}
                      </p>
                      <p className="text-xs text-gray-500">
                        {b.documento} · {b.parentesco}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600 mb-6">
              Este asociado no tiene beneficiarios. Se marcará como fallecido
              directamente.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-white bg-gray-700 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
            >
              {mutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Marcar como fallecido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
