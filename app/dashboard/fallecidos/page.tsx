"use client";

import { useState, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useFallecidos } from "../../../hooks/useFallecidos";

export default function FallecidosPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  const { data, isLoading } = useFallecidos({
    search: search || undefined,
  });

  const fallecidos = data?.data ?? [];

  const formatDate = (d?: string | null) => (d ? d.split("T")[0] : "-");

  const nombreCompleto = (f: (typeof fallecidos)[0]) =>
    `${f.primer_nombre} ${f.segundo_nombre || ""} ${f.primer_apellido} ${
      f.segundo_apellido || ""
    }`;

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
  };

  return (
    <>
      <main className="flex-1 overflow-auto p-6">
        <div className="flex justify-between items-center mb-4 gap-4">
          <p className="text-gray-600">
            Registro de asociados y beneficiarios fallecidos.
          </p>
          {/* Buscador */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre o documento..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-black outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                title="Limpiar búsqueda"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            <p className="text-gray-500">Cargando fallecidos...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-stone-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Documento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Parentesco
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Fecha Fallecimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Fecha Afiliación
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fallecidos.length > 0 ? (
                    fallecidos.map((f) => (
                      <tr
                        key={f.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              f.tipo === "asociado"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {f.tipo === "asociado"
                              ? "Asociado"
                              : "Beneficiario"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {nombreCompleto(f)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {f.documento}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {f.parentesco || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(f.fecha_fallecimiento)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(f.fecha_afiliacion)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        <p className="text-lg">
                          {search
                            ? "No se encontraron fallecidos con ese criterio"
                            : "No hay fallecidos registrados"}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
