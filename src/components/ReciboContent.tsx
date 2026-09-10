import type { ComprobanteData } from "../hooks/useComprobante";

interface ReciboContentProps {
  data: ComprobanteData;
}

export default function ReciboContent({ data }: ReciboContentProps) {
  const formatDate = (d?: string) => (d ? d.split("T")[0] : "-");

  return (
    <div className="comprobante-recibo p-8 text-black min-h-screen print:min-h-0">
      <style>{`
        @media print {
          @page {
            size: 140mm 215mm;
            margin: 15mm;
          }
          body {
            margin: 0;
          }
          .comprobante-recibo {
            padding: 0 !important;
            min-height: 0;
            page-break-inside: avoid;
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
  );
}