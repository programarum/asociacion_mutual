"use client";

import { useState } from "react";
import { X, UserPlus, PencilLine, Trash, Loader2 } from "lucide-react";
import {
  useBeneficiarios,
  useCreateBeneficiario,
  useUpdateBeneficiario,
  useDeleteBeneficiario,
  type Beneficiario,
} from "../../hooks/useBeneficiarios";

interface BeneficiariosModalProps {
  asociadoId: number;
  asociadoNombre: string;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  documento: string;
  fecha_nacimiento: string;
  parentesco: string;
  sexo: string;
  fecha_afiliacion: string;
}

const emptyForm: FormData = {
  primer_nombre: "",
  segundo_nombre: "",
  primer_apellido: "",
  segundo_apellido: "",
  documento: "",
  fecha_nacimiento: "",
  parentesco: "",
  sexo: "",
  fecha_afiliacion: "",
};

export default function BeneficiariosModal({
  asociadoId,
  asociadoNombre,
  isOpen,
  onClose,
}: BeneficiariosModalProps) {
  const { data, isLoading } = useBeneficiarios({ asociadoId, enabled: isOpen });
  const createMutation = useCreateBeneficiario(asociadoId);
  const updateMutation = useUpdateBeneficiario(asociadoId);
  const deleteMutation = useDeleteBeneficiario(asociadoId);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const beneficiarios = data?.data ?? [];

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowForm(true);
  };

  const handleOpenEdit = (b: Beneficiario) => {
    setForm({
      primer_nombre: b.primer_nombre,
      segundo_nombre: b.segundo_nombre || "",
      primer_apellido: b.primer_apellido,
      segundo_apellido: b.segundo_apellido || "",
      documento: b.documento,
      fecha_nacimiento: b.fecha_nacimiento?.split("T")[0] || "",
      parentesco: b.parentesco,
      sexo: b.sexo,
      fecha_afiliacion: b.fecha_afiliacion?.split("T")[0] || "",
    });
    setEditingId(b.id);
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.primer_nombre || !form.primer_apellido || !form.documento) {
      setError("Los campos marcados con * son obligatorios");
      return;
    }

    const payload = {
      ...form,
      segundo_nombre: form.segundo_nombre || undefined,
      segundo_apellido: form.segundo_apellido || undefined,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setShowForm(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Error al guardar el beneficiario");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteConfirmId(null);
    } catch {
      setError("Error al eliminar el beneficiario");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Beneficiarios de {asociadoNombre}
            </h3>
            <p className="text-sm text-gray-500">
              {beneficiarios.length} beneficiario(s) registrado(s)
            </p>
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

          {!showForm && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={handleOpenCreate}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                Agregar beneficiario
              </button>
            </div>
          )}

          {/* Formulario crear/editar */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4"
            >
              <h4 className="font-semibold text-gray-700">
                {editingId ? "Editar beneficiario" : "Nuevo beneficiario"}
              </h4>
              <div className="grid grid-cols-2 gap-3">
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
                    Parentesco *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Hijo, Cónyuge"
                    value={form.parentesco}
                    onChange={(e) =>
                      setForm({ ...form, parentesco: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sexo *
                  </label>
                  <select
                    required
                    value={form.sexo}
                    onChange={(e) =>
                      setForm({ ...form, sexo: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.fecha_nacimiento}
                    onChange={(e) =>
                      setForm({ ...form, fecha_nacimiento: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Afiliación *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.fecha_afiliacion}
                    onChange={(e) =>
                      setForm({ ...form, fecha_afiliacion: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {editingId ? "Guardar cambios" : "Registrar"}
                </button>
              </div>
            </form>
          )}

          {/* Tabla de beneficiarios */}
          {isLoading ? (
            <div className="py-8 text-center flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              <p className="text-gray-500">Cargando beneficiarios...</p>
            </div>
          ) : beneficiarios.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-stone-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                      Nombre
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                      Documento
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                      Parentesco
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                      Sexo
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                      Nacimiento
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                      Afiliación
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {beneficiarios.map((b) => (
                    <tr key={b.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {b.primer_nombre} {b.segundo_nombre || ""}{" "}
                        {b.primer_apellido} {b.segundo_apellido || ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {b.documento}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {b.parentesco}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {b.sexo === "M" ? "Masculino" : "Femenino"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {b.fecha_nacimiento?.split("T")[0]}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {b.fecha_afiliacion?.split("T")[0]}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {deleteConfirmId === b.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDelete(b.id)}
                              disabled={deleteMutation.isPending}
                              className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                            >
                              {deleteMutation.isPending
                                ? "..."
                                : "Confirmar"}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(b)}
                              className="text-yellow-600 hover:text-yellow-800"
                              title="Editar"
                            >
                              <PencilLine className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(b.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !showForm && (
              <div className="py-8 text-center text-gray-500">
                <p>No hay beneficiarios registrados para este asociado.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
