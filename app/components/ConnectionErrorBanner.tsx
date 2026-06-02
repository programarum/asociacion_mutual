"use client";

import { useEffect, useState } from "react";
import { WifiOff, X, RefreshCw } from "lucide-react";

interface ErrorInfo {
  message: string;
  status?: number;
}

export default function ConnectionErrorBanner() {
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const handleError = (event: CustomEvent<ErrorInfo>) => {
      setError(event.detail);
      setIsVisible(true);
      setIsExiting(false);
    };

    window.addEventListener(
      "api-connection-error",
      handleError as EventListener
    );

    return () => {
      window.removeEventListener(
        "api-connection-error",
        handleError as EventListener
      );
    };
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setError(null);
      setIsExiting(false);
    }, 300);
  };

  const handleRetry = () => {
    handleDismiss();
    // Recargar la página para reintentar las solicitudes
    window.location.reload();
  };

  if (!isVisible || !error) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isExiting
          ? "opacity-0 -translate-y-full"
          : "opacity-100 translate-y-0"
      }`}
    >
      <div className="bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Icono y mensaje */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 bg-red-800/40 rounded-full p-2">
                <WifiOff className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm">
                  Error de conexión
                </p>
                <p className="text-red-100 text-xs truncate">
                  {error.message}
                </p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-lg transition-colors duration-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reintentar
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 hover:bg-white/15 text-white/80 hover:text-white rounded-lg transition-colors duration-200"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
