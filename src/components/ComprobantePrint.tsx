import { useNavigate } from "react-router-dom";
import { useComprobante } from "../hooks/useComprobante";
import ReciboContent from "./ReciboContent";

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
  const navigate = useNavigate();
  const { data, isLoading } = useComprobante({
    asociadoId,
    pagoId,
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden max-h-[95vh] flex flex-col">
          {/* Toolbar (hidden on print) */}
          <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">
              Comprobante de Pago
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/print/${asociadoId}/${pagoId}`)}
                disabled={!data}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
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

          {/* Comprobante preview */}
          <div className="overflow-y-auto flex-1">
            {isLoading || !data ? (
              <div className="py-12 text-center text-gray-500">
                Cargando comprobante...
              </div>
            ) : (
              <ReciboContent data={data} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}