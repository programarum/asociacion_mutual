import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import ReciboContent from "../components/ReciboContent";
import { useComprobante } from "../hooks/useComprobante";
import AuthService from "../services/AuthService";

export default function PrintRecibo() {
  const { asociadoId, pagoId } = useParams();
  const navigate = useNavigate();
  const sheetRef = useRef<HTMLDivElement>(null);

  const asociadoIdNum = Number(asociadoId);
  const pagoIdNum = Number(pagoId);

  const { data, isLoading, isError } = useComprobante({
    asociadoId: asociadoIdNum,
    pagoId: pagoIdNum,
    enabled:
      Number.isFinite(asociadoIdNum) &&
      Number.isFinite(pagoIdNum) &&
      asociadoIdNum > 0 &&
      pagoIdNum > 0,
  });

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <div className="bg-gray-100 min-h-screen print:bg-white print:min-h-0">
      <style>{`
        @media print {
          @page {
            /* Papel precortado 13.97 × 21.59 cm (≈ 14 × 21.5 cm) */
            size: 140mm 215.9mm;
            /* Márgenes mínimos: sup/izq/der 5mm · inferior 10mm (rango 5-12mm) */
            margin: 5mm 5mm 10mm 5mm;
          }
        }
      `}</style>

      {/* Toolbar (oculto en impresión) */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              Recibo de Pago
            </h1>
            <p className="text-xs text-gray-500">
              Se imprimirá únicamente el recibo.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
            <button
              onClick={() => window.print()}
              disabled={!data}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* Contenido del recibo */}
      <div
        className="mx-auto py-6 print:py-0"
        style={{ width: "110mm" }}
      >
        {isLoading ? (
          <div className="py-16 text-center flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            <p className="text-gray-500">Cargando comprobante...</p>
          </div>
        ) : isError || !data ? (
          <div className="py-16 text-center text-gray-500">
            <p className="text-lg">
              No se pudo cargar el comprobante.
            </p>
          </div>
        ) : (
          <div
            ref={sheetRef}
            className="bg-white rounded-lg shadow-lg print:rounded-none print:shadow-none"
          >
            <ReciboContent data={data} />
          </div>
        )}
      </div>
    </div>
  );
}
