import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

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
}

interface NuevoAsociadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const emptyForm: FormData = {
  codigo: "",
  primer_nombre: "",
  segundo_nombre: "",
  primer_apellido: "",
  segundo_apellido: "",
  documento: "",
  email: "",
  telefono: "",
  direccion: "",
};

export default function NuevoAsociadoModal({
  isOpen,
  onClose,
  onCreated,
}: NuevoAsociadoModalProps) {
  const [form, setForm] = useState<FormData>(emptyForm);
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

    if (!/^\d{1,3}$/.test(form.codigo)) {
      setError("El código debe ser numérico de 1 a 3 dígitos (ej. 04, 5, 123)");
      return;
    }

    setLoading(true);
    try {
      await invoke("create_asociado", {
        codigo: form.codigo,
        primer_nombre: form.primer_nombre,
        segundo_nombre: form.segundo_nombre || null,
        primer_apellido: form.primer_apellido,
        segundo_apellido: form.segundo_apellido || null,
        documento: form.documento,
        email: form.email,
        telefono: form.telefono,
        direccion: form.direccion,
      });
      setForm(emptyForm);
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Error al crear el asociado");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">
            Nuevo Asociado
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
                maxLength={3}
                value={form.codigo}
                onChange={(e) =>
                  setForm({ ...form, codigo: e.target.value.replace(/\D/g, "") })
                }
                className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej. 04"
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
                Email *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
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
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
