import { useState } from "react";
import { Database, FileCode, Loader2, Download, CheckCircle } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

export default function BackupPage() {
  const [downloading, setDownloading] = useState<"sqlite" | "sql" | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const handleDownloadSqlite = async () => {
    setDownloading("sqlite");
    setMessage(null);
    try {
      const filePath = await invoke<string>("export_sqlite");
      setMessage({
        text: `Copia SQLite guardada en: ${filePath}`,
        type: "success",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({
        text: msg || "Error al descargar la copia SQLite",
        type: "error",
      });
    }
    setDownloading(null);
  };

  const handleDownloadSql = async () => {
    setDownloading("sql");
    setMessage(null);
    try {
      const filePath = await invoke<string>("export_sql");
      setMessage({
        text: `Dump SQL guardado en: ${filePath}`,
        type: "success",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({
        text: msg || "Error al descargar el dump SQL",
        type: "error",
      });
    }
    setDownloading(null);
  };

  return (
    <main className="flex-1 overflow-auto p-6">
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <p className="text-gray-600 mb-6">
        Genera copias de seguridad de la base de datos del sistema. Los archivos
        se guardan en tu carpeta de Descargas.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Base de Datos (SQLite)
              </h3>
              <p className="text-xs text-gray-500">Copia binaria exacta</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Descarga el archivo <code>.sqlite</code> completo. Para restaurar,
            solo reemplaza el archivo en el servidor.
          </p>
          <button
            onClick={handleDownloadSqlite}
            disabled={downloading !== null}
            className="w-full px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            {downloading === "sqlite" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Descargar SQLite
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileCode className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-lg font-bold text-gray-800">Dump SQL</h3>
              <p className="text-xs text-gray-500">Texto legible/portable</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Genera un archivo <code>.sql</code> con todos los INSERT. Es legible
            y se puede importar en otros motores.
          </p>
          <button
            onClick={handleDownloadSql}
            disabled={downloading !== null}
            className="w-full px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            {downloading === "sql" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Descargar SQL
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-3xl">
        <p className="text-sm text-yellow-800">
          <strong>Recomendación:</strong> Realiza copias de seguridad
          regularmente. Guarda los archivos en una ubicación externa al equipo.
        </p>
      </div>
    </main>
  );
}
