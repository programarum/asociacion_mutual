import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  PencilLine,
  SquareChartGantt,
  Trash,
  CreditCard,
  History,
  Search,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import BeneficiariosModal from "../components/BeneficiariosModal";
import EditAsociadoModal from "../components/EditAsociadoModal";
import DeleteAsociadoModal from "../components/DeleteAsociadoModal";
import RegistrarPagoModal from "../components/RegistrarPagoModal";
import HistorialPagosModal from "../components/HistorialPagosModal";
import MarcarFallecidoModal from "../components/MarcarFallecidoModal";

interface Cobertura {
  id: number;
  asociado_id: number;
  fecha_inicio: string | null;
  mes_pagado_hasta: string | null;
  estado: "vigente" | "moroso";
}

interface Asociado {
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
  mese_pagados?: string;
  gran_total?: string;
  cobertura?: Cobertura | null;
}

type ModalType =
  | "beneficiarios"
  | "editar"
  | "eliminar"
  | "pago"
  | "historial"
  | "fallecer"
  | null;

export default function Asociados() {
  const [asociados, setAsociados] = useState<Asociado[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedAsociado, setSelectedAsociado] = useState<Asociado | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchAsociados = async (searchTerm?: string) => {
    try {
      const result = await invoke<{ data: Asociado[] }>("list_asociados", {
        search: searchTerm || null,
      });
      setAsociados(result.data);
    } catch (error) {
      console.error("Error fetching asociados:", error);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchAsociados();
  }, []);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
        fetchAsociados(searchInput || undefined);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    fetchAsociados();
  };

  const openModal = (type: ModalType, asociado: Asociado) => {
    setSelectedAsociado(asociado);
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedAsociado(null);
  };

  const nombreCompleto = (a: Asociado) =>
    `${a.primer_nombre} ${a.primer_apellido}`;

  const formatDate = (d?: string | null) => (d ? d.split("T")[0] : "-");

  return (
    <>
      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="flex justify-between items-center mb-4 gap-4">
          {/* Buscador */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por código, nombre, documento o email..."
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
          <Link to="/dashboard" className="btn btn-primary shrink-0">
            INICIO
          </Link>
        </div>
      {!isMounted ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">Cargando datos...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-stone-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Mes Pagado Hasta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Gran Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-stone-900 divide-y divide-gray-200">
                {asociados.length > 0 ? (
                  asociados.map((asociado, index) => {
                    const estado = asociado.cobertura?.estado ?? "moroso";
                    return (
                      <tr
                        key={asociado.id}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-blue-50 transition-colors duration-200`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {asociado.codigo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {asociado.primer_nombre}{" "}
                          {asociado.segundo_nombre || ""}{" "}
                          {asociado.primer_apellido}{" "}
                          {asociado.segundo_apellido || ""}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {asociado.documento}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {asociado.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {asociado.telefono}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(asociado.cobertura?.mes_pagado_hasta)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              estado === "vigente"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {estado === "vigente" ? "Vigente" : "Moroso"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          ${asociado.gran_total || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openModal("pago", asociado)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Registrar pago"
                            >
                              <CreditCard className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() =>
                                openModal("historial", asociado)
                              }
                              className="text-indigo-600 hover:text-indigo-800 transition-colors"
                              title="Historial de pagos"
                            >
                              <History className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() =>
                                openModal("beneficiarios", asociado)
                              }
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Beneficiarios"
                            >
                              <SquareChartGantt className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => openModal("editar", asociado)}
                              className="text-yellow-600 hover:text-yellow-800 transition-colors"
                              title="Editar asociado"
                            >
                              <PencilLine className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => openModal("fallecer", asociado)}
                              className="text-gray-600 hover:text-gray-900 transition-colors"
                              title="Marcar fallecido"
                            >
                              <span className="text-base">†</span>
                            </button>
                            <button
                              onClick={() => openModal("eliminar", asociado)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Eliminar asociado"
                            >
                              <Trash className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      <p className="text-lg">
                        {search
                          ? "No se encontraron asociados con ese criterio"
                          : "No hay asociados registrados"}
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

      {/* Modales */}
      {selectedAsociado && activeModal === "beneficiarios" && (
        <BeneficiariosModal
          asociadoId={selectedAsociado.id}
          asociadoNombre={nombreCompleto(selectedAsociado)}
          isOpen={true}
          onClose={closeModal}
        />
      )}

      {selectedAsociado && activeModal === "editar" && (
        <EditAsociadoModal
          asociado={selectedAsociado}
          isOpen={true}
          onClose={closeModal}
          onUpdated={fetchAsociados}
        />
      )}

      {selectedAsociado && activeModal === "eliminar" && (
        <DeleteAsociadoModal
          asociadoId={selectedAsociado.id}
          asociadoNombre={nombreCompleto(selectedAsociado)}
          isOpen={true}
          onClose={closeModal}
          onDeleted={fetchAsociados}
        />
      )}

      {selectedAsociado && activeModal === "pago" && (
        <RegistrarPagoModal
          asociadoId={selectedAsociado.id}
          asociadoNombre={nombreCompleto(selectedAsociado)}
          isOpen={true}
          onClose={closeModal}
        />
      )}

      {selectedAsociado && activeModal === "historial" && (
        <HistorialPagosModal
          asociadoId={selectedAsociado.id}
          asociadoNombre={nombreCompleto(selectedAsociado)}
          isOpen={true}
          onClose={closeModal}
        />
      )}

      {selectedAsociado && activeModal === "fallecer" && (
        <MarcarFallecidoModal
          asociadoId={selectedAsociado.id}
          asociadoNombre={nombreCompleto(selectedAsociado)}
          isOpen={true}
          onClose={closeModal}
          onCompleted={fetchAsociados}
        />
      )}
    </>
  );
}
