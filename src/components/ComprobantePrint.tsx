import { useEffect, useRef } from "react";
import { useComprobante } from "../hooks/useComprobante";

interface ComprobantePrintProps {
  asociadoId: number;
  pagoId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ComprobantePrint({
  asociadoId,
  pagoId,
  isOpen,
  onClose,
}: ComprobantePrintProps) {
  const { data, isLoading } = useComprobante({
    asociadoId,
    pagoId,
    enabled: isOpen,
  });
  const printedRef = useRef(false);

  useEffect(() => {
    if (data && !isLoading && !printedRef.current) {
      printedRef.current = true;
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [data, isLoading]);

  useEffect(() => {
    if (!isOpen) {
      printedRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (d?: string) => (d ? d.split("T")[0] : "-");

  return (
    <>
      {/* Overlay (hidden on print) */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden print:block print:bg-white print:p-0 print:relative print:z-0">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden max-h-[95vh] flex flex-col print:max-h-none print:rounded-none print:shadow-none print:max-w-none">
          {/* Toolbar (hidden on print) */}
          <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center print:hidden">
            <h3 className="text-lg font-bold text-gray-800">
              Comprobante de Pago
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium text-sm"
              >
                Imprimir
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>

          {/* Comprobante content */}
          <div className="overflow-y-auto flex-1 print:overflow-visible print:flex-none">
            {isLoading || !data ? (
              <div className="py-12 text-center text-gray-500 print:hidden">
                Cargando comprobante...
              </div>
            ) : (
              <div className="comprobante-recibo p-8 text-black">
                <style>{`
                  @media print {
                    @page {
                      size: 5.5in 8.5in landscape;
                      margin: 10mm;
                    }
                    body {
                      margin: 0;
                    }
                  }
                  .comprobante-recibo {
                    font-family: "Times New Roman", serif;
                    font-size: 12px;
                  }
                  .comprobante-linea {
                    border-top: 1px dashed #000;
                    margin: 8px 0;
                  }
                `}</style>

                {/* Encabezado */}
                <div className="text-center mb-4">
                  <h1 className="text-xl font-bold uppercase">
                    Asociación Mutual
                  </h1>
                  <h2 className="text-base font-semibold uppercase mt-1">
                    Recibo de Pago N° {data.recibo_numero}
                  </h2>
                </div>

                <div className="comprobante-linea" />

                {/* Datos del asociado */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div>
                    <p>
                      <strong>Asociado:</strong> {data.asociado.nombre_completo}
                    </p>
                    <p>
                      <strong>Documento:</strong> {data.asociado.documento}
                    </p>
                    <p>
                      <strong>Código:</strong> {data.asociado.codigo}
                    </p>
                  </div>
                  <div className="text-right">
                    <p>
                      <strong>Fecha de pago:</strong>{" "}
                      {formatDate(data.pago.fecha_pago)}
                    </p>
                    <p>
                      <strong>Fecha impresión:</strong>{" "}
                      {formatDate(data.fecha_impresion)}
                    </p>
                  </div>
                </div>

                {/* Meses pagados */}
                <div className="mb-4">
                  <p className="font-semibold mb-1">
                    Meses cancelados ({data.pago.meses_pagados}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {data.pago.meses_cubiertos.map((m, i) => (
                      <span
                        key={i}
                        className="inline-block border border-gray-400 px-2 py-0.5 rounded text-xs"
                      >
                        {m.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Beneficiarios */}
                {data.beneficiarios.length > 0 && (
                  <div className="mb-4">
                    <p className="font-semibold mb-1">Beneficiarios:</p>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-400">
                          <th className="text-left py-1">Nombre</th>
                          <th className="text-left py-1">Parentesco</th>
                          <th className="text-left py-1">Documento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.beneficiarios.map((b) => (
                          <tr
                            key={b.id}
                            className="border-b border-gray-200"
                          >
                            <td className="py-1">{b.nombre_completo}</td>
                            <td className="py-1">{b.parentesco}</td>
                            <td className="py-1">{b.documento}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Valor */}
                <div className="mb-6 border border-gray-400 rounded p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Valor cancelado:</span>
                    <span className="text-lg font-bold">
                      {data.pago.monto_formateado}
                    </span>
                  </div>
                  <p className="text-xs italic">
                    {data.pago.monto_letras}
                  </p>
                </div>

                <div className="comprobante-linea" />

                {/* Firma */}
                <div className="mt-12 flex justify-between">
                  <div className="text-center w-40">
                    <div className="border-t border-black mb-1" />
                    <p className="text-xs">Firma del Asociado</p>
                  </div>
                  <div className="text-center w-40">
                    <div className="border-t border-black mb-1" />
                    <p className="text-xs">
                      Sello y Firma Administración
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
