import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface AsociadoData {
  id: number;
  codigo: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  documento: string;
  email: string;
  telefono: string;
  direccion: string;
  mes_actual?: string;
  mese_pagados?: string | number;
  gran_total?: string | number;
}

interface EditAsociadoModalProps {
  asociado: AsociadoData;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

interface FormData {
  codigo: string;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  documento: string;
  email: string;
  telefono: string;
  direccion: string;
  mes_actual: string;
  mese_pagados: string;
  gran_total: string;
}

export default function EditAsociadoModal({
  asociado,
  isOpen,
  onClose,
  onUpdated,
}: EditAsociadoModalProps) {
  const [form, setForm] = useState<FormData>({
    codigo: asociado.codigo,
    primer_nombre: asociado.primer_nombre,
    segundo_nombre: asociado.segundo_nombre || "",
    primer_apellido: asociado.primer_apellido,
    segundo_apellido: asociado.segundo_apellido || "",
    documento: asociado.documento,
    email: asociado.email,
    telefono: asociado.telefono,
    direccion: asociado.direccion,
    mes_actual: asociado.mes_actual?.split("T")[0] || "",
    mese_pagados: String(asociado.mese_pagados || ""),
    gran_total: String(asociado.gran_total || ""),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.codigo || !form.primer_nombre || !form.documento || !form.email) {
      setError("Los campos marcados con * son obligatorios");
      return;
    }

    setLoading(true);
    try {
      await invoke("update_asociado", {
        id: asociado.id,
        codigo: form.codigo,
        primer_nombre: form.primer_nombre,
        segundo_nombre: form.segundo_nombre || null,
        primer_apellido: form.primer_apellido,
        segundo_apellido: form.segundo_apellido || null,
        documento: form.documento,
        email: form.email,
        telefono: form.telefono,
        direccion: form.direccion,
        mes_actual: form.mes_actual || null,
        mese_pagados: form.mese_pagados || null,
        gran_total: form.gran_total || null,
      });
      onUpdated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Error al actualizar el asociado");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">
            Editar Asociado — {asociado.primer_nombre}{" "}
            {asociado.primer_apellido}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código *
              </label>
              <input
                type="text"
                required
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Documento *
              </label>
              <input
                type="text"
                required
                value={form.documento}
                onChange={(e) =>
                  setForm({ ...form, documento: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primer Nombre *
              </label>
              <input
                type="text"
                required
                value={form.primer_nombre}
                onChange={(e) =>
                  setForm({ ...form, primer_nombre: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Segundo Nombre
              </label>
              <input
                type="text"
                value={form.segundo_nombre}
                onChange={(e) =>
                  setForm({ ...form, segundo_nombre: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primer Apellido *
              </label>
              <input
                type="text"
                required
                value={form.primer_apellido}
                onChange={(e) =>
                  setForm({ ...form, primer_apellido: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Segundo Apellido
              </label>
              <input
                type="text"
                value={form.segundo_apellido}
                onChange={(e) =>
                  setForm({ ...form, segundo_apellido: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono *
              </label>
              <input
                type="text"
                required
                value={form.telefono}
                onChange={(e) =>
                  setForm({ ...form, telefono: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección *
              </label>
              <input
                type="text"
                required
                value={form.direccion}
                onChange={(e) =>
                  setForm({ ...form, direccion: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mes Actual
              </label>
              <input
                type="date"
                value={form.mes_actual}
                onChange={(e) =>
                  setForm({ ...form, mes_actual: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meses Pagados
              </label>
              <input
                type="text"
                value={form.mese_pagados}
                onChange={(e) =>
                  setForm({ ...form, mese_pagados: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gran Total
              </label>
              <input
                type="text"
                value={form.gran_total}
                onChange={(e) =>
                  setForm({ ...form, gran_total: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
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
              disabled={loading}
              className="px-4 py-2 text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
