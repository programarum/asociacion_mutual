"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";
import { PencilLine, SquareChartGantt, Trash, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../../../hooks/useAuth";
import BeneficiariosModal from "../../components/BeneficiariosModal";
import EditAsociadoModal from "../../components/EditAsociadoModal";
import DeleteAsociadoModal from "../../components/DeleteAsociadoModal";

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
  mese_pagados?: number;
  gran_total?: string | number;
}

type ModalType = "beneficiarios" | "editar" | "eliminar" | null;

export default function Asociados() {
  const { logout } = useAuth();
  const [asociados, setAsociados] = useState<Asociado[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedAsociado, setSelectedAsociado] = useState<Asociado | null>(
    null
  );

  const fetchAsociados = async () => {
    try {
      const response = await api.get("/asociados");
      setAsociados(response.data.data);
    } catch (error) {
      console.error("Error fetching asociados:", error);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchAsociados();
  }, []);

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

  return (
    <>
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Asociados</h2>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        <p className="text-gray-600 mb-6">Aquí puedes gestionar tus asociados.</p>
        <div className="flex justify-end mb-6">
          <Link href="/dashboard" className="btn btn-primary">
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
                    Primer Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Segundo Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Primer Apellido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Segundo Apellido
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
                    Dirección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Mes Actual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Meses Pagados
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
                  asociados.map((asociado, index) => (
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
                        {asociado.primer_nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {asociado.segundo_nombre || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {asociado.primer_apellido}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {asociado.segundo_apellido || "-"}
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
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {asociado.direccion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {asociado.mes_actual || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {asociado.mese_pagados || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        ${asociado.gran_total || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-2">
                        <button
                          onClick={() => openModal("beneficiarios", asociado)}
                          className="text-green-600 hover:text-green-800 transition-colors"
                          title="Beneficiarios"
                        >
                          <SquareChartGantt />
                        </button>
                        <button
                          onClick={() => openModal("editar", asociado)}
                          className="text-yellow-600 hover:text-yellow-800 transition-colors"
                          title="Editar asociado"
                        >
                          <PencilLine />
                        </button>
                        <button
                          onClick={() => openModal("eliminar", asociado)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Eliminar asociado"
                        >
                          <Trash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={13}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      <p className="text-lg">No hay asociados registrados</p>
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
    </>
  );
}
