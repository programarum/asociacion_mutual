import { useState } from "react";
import { X, Loader2, AlertTriangle, UserCog } from "lucide-react";
import {
  useBeneficiarios,
  useTransferAndDelete,
} from "../hooks/useBeneficiarios";
import { invoke } from "@tauri-apps/api/core";

interface DeleteAsociadoModalProps {
  asociadoId: number;
  asociadoNombre: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteAsociadoModal({
  asociadoId,
  asociadoNombre,
  isOpen,
  onClose,
  onDeleted,
}: DeleteAsociadoModalProps) {
  const { data, isLoading } = useBeneficiarios({
    asociadoId,
    enabled: isOpen,
  });
  const transferMutation = useTransferAndDelete(asociadoId);

  const [selectedBeneficiario, setSelectedBeneficiario] =
    useState<number | null>(null);
  const [mode, setMode] = useState<"select" | "confirm">("select");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const beneficiarios = data?.data ?? [];

  const handleSimpleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      await invoke("delete_asociado", { id: asociadoId });
      onDeleted();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Error al eliminar el asociado");
    }
    setDeleting(false);
  };

  const handleTransferDelete = async () => {
    if (!selectedBeneficiario) {
      setError("Debe seleccionar un beneficiario para promocionar");
      return;
    }

    setDeleting(true);
    setError("");
    try {
      await transferMutation.mutateAsync(selectedBeneficiario);
      onDeleted();
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(
        e.response?.data?.message ||
          "Error al promocionar el beneficiario y eliminar el asociado"
      );
    }
    setDeleting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-bold text-gray-800">
              Eliminar Asociado — {asociadoNombre}
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
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Estás a punto de eliminar al asociado{" "}
              <strong>{asociadoNombre}</strong>. Si este asociado tiene
              beneficiarios, puedes seleccionar uno para convertirlo en el nuevo
              asociado principal, conservando los datos de contacto y pago.
            </p>
          </div>

          {isLoading ? (
            <div className="py-8 text-center flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              <p className="text-gray-500">Cargando beneficiarios...</p>
            </div>
          ) : beneficiarios.length > 0 ? (
            <>
              <h4 className="font-semibold text-gray-700 mb-3">
                Selecciona un beneficiario para promocionar a asociado:
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
                      onChange={() => {
                        setSelectedBeneficiario(b.id);
                        setMode("confirm");
                      }}
                      className="w-4 h-4"
                    />
                    <UserCog className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {b.primer_nombre} {b.segundo_nombre || ""}{" "}
                        {b.primer_apellido} {b.segundo_apellido || ""}
                      </p>
                      <p className="text-xs text-gray-500">
                        {b.documento} · {b.parentesco} ·{" "}
                        {b.sexo === "M" ? "Masculino" : "Femenino"}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-3">
                  O elimina el asociado sin promocionar ningún beneficiario
                  (todos sus beneficiarios también serán eliminados):
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600 mb-6">
              Este asociado no tiene beneficiarios. Se eliminará directamente.
            </p>
          )}

          <div className="flex justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <div className="flex gap-3">
              {beneficiarios.length > 0 && selectedBeneficiario && (
                <button
                  type="button"
                  onClick={handleTransferDelete}
                  disabled={deleting || transferMutation.isPending}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
                >
                  {(deleting || transferMutation.isPending) && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Promocionar y eliminar
                </button>
              )}
              <button
                type="button"
                onClick={handleSimpleDelete}
                disabled={deleting}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Eliminar asociado
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
