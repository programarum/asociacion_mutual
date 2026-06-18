"use client";

import { useState } from "react";
import { X, Loader2, History, Printer } from "lucide-react";
import { usePagos } from "../../hooks/usePagos";
import ComprobantePrint from "./ComprobantePrint";

interface HistorialPagosModalProps {
  asociadoId: number;
  asociadoNombre: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function HistorialPagosModal({
  asociadoId,
  asociadoNombre,
  isOpen,
  onClose,
}: HistorialPagosModalProps) {
  const { data, isLoading } = usePagos({
    asociadoId,
    enabled: isOpen,
  });
  const [printPagoId, setPrintPagoId] = useState<number | null>(null);

  if (!isOpen) return null;

  const pagos = data?.data ?? [];
  const totalPagado = pagos.reduce(
    (sum, p) => sum + parseFloat(p.monto),
    0
  );

  const formatDate = (d: string) => (d ? d.split("T")[0] : "-");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-800">
              Historial de Pagos — {asociadoNombre}
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
          {isLoading ? (
            <div className="py-8 text-center flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              <p className="text-gray-500">Cargando historial...</p>
            </div>
          ) : pagos.length > 0 ? (
            <>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200 flex justify-between items-center">
                <span className="text-sm text-blue-700">
                  Total pagado ({pagos.length} pago
                  {pagos.length !== 1 ? "s" : ""}):
                </span>
                <span className="text-xl font-bold text-blue-800">
                  ${totalPagado.toFixed(2)}
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-stone-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                        Meses
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                        Desde
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                        Hasta
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-white uppercase">
                        Monto
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-white uppercase">
                        Imprimir
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pagos.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDate(p.fecha_pago)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {p.meses_pagados}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDate(p.mes_desde)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDate(p.mes_hasta)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right text-green-600">
                          ${parseFloat(p.monto).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <button
                            onClick={() => setPrintPagoId(p.id)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Imprimir comprobante"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p className="text-lg">No hay pagos registrados</p>
              <p className="text-sm mt-1">
                Este asociado aún no ha realizado ningún pago.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Comprobante de impresión */}
      {printPagoId && (
        <ComprobantePrint
          asociadoId={asociadoId}
          pagoId={printPagoId}
          isOpen={true}
          onClose={() => setPrintPagoId(null)}
        />
      )}
    </div>
  );
}
