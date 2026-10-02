import { useLayoutEffect, useRef, useState } from "react";
import type { ComprobanteData } from "../hooks/useComprobante";
import {
  MM,
  SHEET_W,
  PAGE_H,
  HALF_H,
  PAD_X,
  PAD_Y,
  decidirDisposicion,
  type ModoHoja,
} from "./reciboLayout";
import logoImg from "../assets/recibos/logo.png";

interface ReciboContentProps {
  data: ComprobanteData;
}

export default function ReciboContent({ data }: ReciboContentProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<ModoHoja>("auto");

  useLayoutEffect(() => {
    const bodyEl = bodyRef.current;
    if (!bodyEl) return;

    const measure = () => {
      const bodyH = bodyEl.getBoundingClientRect().height / MM;
      setMode(decidirDisposicion(bodyH));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(bodyEl);
    window.addEventListener("load", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("load", measure);
    };
  }, [data]);

  const formatDate = (d?: string) => (d ? d.split("T")[0] : "-");

  const hojaHeight =
    mode === "media"
      ? `${HALF_H}mm`
      : mode === "entera" || mode === "auto"
        ? `${PAGE_H}mm`
        : "auto";

  const empresa = data.empresa;
  const nombreEmpresa = empresa?.nombre?.trim() || "ASOCIACIÓN MUTUAL";

  return (
    <div className="recibo-root text-black">
      <style>{`
        @media print {
          body { margin: 0; }
        }
        .recibo-root {
          font-family: "Times New Roman", Times, serif;
          font-size: 12px;
          color: #000;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .recibo-hoja {
          width: ${SHEET_W}mm;
          box-sizing: border-box;
          padding: ${PAD_Y}mm ${PAD_X}mm;
          background: #fff;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .recibo-linea {
          border-top: 1px dashed #666;
          margin: 4px 0;
        }

        /* Encabezado: logo a la izquierda, nombre centrado, datos a lo ancho */
        .recibo-header {
          position: relative;
          border-bottom: 2px solid #1e3a8a;
          padding-bottom: 4px;
          padding-top: 1px;
          margin-bottom: 6px;
          min-height: 26mm;
        }
        .recibo-logo {
          position: absolute;
          left: 0;
          top: 1px;
          width: 25mm;
          height: 25mm;
          object-fit: contain;
        }
        .empresa-nombre {
          text-align: center;
          padding: 0 26mm;
          font-size: 15px;
          font-weight: 700;
          text-transform: uppercase;
          color: #1e3a8a;
          line-height: 1.2;
        }
        .empresa-datos {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          padding-left: 26mm;
          margin-top: 3px;
        }
        .datos-col {
          display: flex;
          flex-direction: column;
        }
        .datos-col:last-child { text-align: right; }
        .empresa-dato {
          font-size: 9.5px;
          line-height: 1.3;
          color: #222;
          white-space: nowrap;
        }

        .recibo-titulo {
          text-align: center;
          font-size: 15px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .recibo-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3px 16px;
          margin-bottom: 6px;
        }
        .recibo-grid > div:last-child { text-align: right; }
        .recibo-meses {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 2px;
        }
        .recibo-meses span {
          border: 1px solid #888;
          border-radius: 3px;
          padding: 0 5px;
          font-size: 9px;
        }
        .ben-tabla {
          width: 100%;
          border-collapse: collapse;
          margin-top: 3px;
        }
        .ben-tabla thead { display: table-header-group; }
        .ben-tabla th,
        .ben-tabla td {
          border: 1px solid #999;
          padding: 1px 5px;
          font-size: 10px;
          text-align: left;
        }
        .ben-tabla th {
          background: #f0f0f0;
          font-weight: 700;
        }
        .ben-tabla tr { break-inside: avoid; }
        .recibo-valor {
          border: 1px solid #555;
          border-radius: 4px;
          padding: 4px 8px;
          margin-top: 6px;
        }
        .recibo-valor-top {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .recibo-valor-monto { font-size: 14px; font-weight: 700; }
        .recibo-valor-letras { font-size: 9px; font-style: italic; margin-top: 1px; }
        .recibo-firmas {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          margin-top: 14px;
        }
        .recibo-firma {
          width: 55mm;
          text-align: center;
        }
        .recibo-firma-linea {
          border-top: 1px solid #000;
          margin-bottom: 3px;
        }
        .recibo-firma p { font-size: 10px; }

        /* Linea de corte (solo pantalla) */
        .recibo-corte {
          width: ${SHEET_W}mm;
          box-sizing: border-box;
          border-top: 1.5px dashed #9ca3af;
          margin-top: 1mm;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6b7280;
          font-size: 11px;
          font-family: system-ui, sans-serif;
        }
        .recibo-corte::before { content: "\\2702"; }
        @media print {
          .recibo-corte { display: none; }
        }
      `}</style>

      <div
        className="recibo-hoja"
        style={{
          height: hojaHeight,
          minHeight: mode === "overflow" ? `${PAGE_H}mm` : undefined,
        }}
        data-modo={mode}
      >
        <div ref={bodyRef} data-recibo="body">
          {/* Encabezado */}
          <div className="recibo-header">
            <img src={logoImg} alt="Logo" className="recibo-logo" />
            <p className="empresa-nombre">{nombreEmpresa}</p>
            <div className="empresa-datos">
              <div className="datos-col">
                {empresa?.ruc ? (
                  <span className="empresa-dato">NIT: {empresa.ruc}</span>
                ) : null}
                {empresa?.direccion ? (
                  <span className="empresa-dato">Dir.: {empresa.direccion}</span>
                ) : null}
              </div>
              <div className="datos-col">
                {empresa?.telefono1 || empresa?.telefono2 ? (
                  <span className="empresa-dato">
                    Tel.:{" "}
                    {[empresa?.telefono1, empresa?.telefono2]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                ) : null}
                {empresa?.whatsapp ? (
                  <span className="empresa-dato">
                    WhatsApp: {empresa.whatsapp}
                  </span>
                ) : null}
                {empresa?.email ? (
                  <span className="empresa-dato">Email: {empresa.email}</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="recibo-titulo">
            Recibo de Pago N° {data.recibo_numero}
          </div>

          <div className="recibo-linea" />

          {/* Datos del asociado */}
          <div className="recibo-grid">
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
            <div>
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
          <div style={{ marginBottom: 6 }}>
            <p>
              <strong>Meses cancelados ({data.pago.meses_pagados}):</strong>
            </p>
            <div className="recibo-meses">
              {data.pago.meses_cubiertos.map((m, i) => (
                <span key={i}>{m.label}</span>
              ))}
            </div>
          </div>

          {/* Beneficiarios */}
          {data.beneficiarios.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <p>
                <strong>Beneficiarios:</strong>
              </p>
              <table className="ben-tabla">
                <thead>
                  <tr>
                    <th style={{ width: "6%" }}>#</th>
                    <th style={{ width: "50%" }}>Nombre</th>
                    <th style={{ width: "22%" }}>Parentesco</th>
                    <th style={{ width: "22%" }}>Documento</th>
                  </tr>
                </thead>
                <tbody>
                  {data.beneficiarios.map((b, i) => (
                    <tr key={b.id}>
                      <td>{i + 1}</td>
                      <td>{b.nombre_completo}</td>
                      <td>{b.parentesco}</td>
                      <td>{b.documento}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Valor */}
          <div className="recibo-valor">
            <div className="recibo-valor-top">
              <span>
                <strong>Valor cancelado:</strong>
              </span>
              <span className="recibo-valor-monto">
                {data.pago.monto_formateado}
              </span>
            </div>
            <p className="recibo-valor-letras">{data.pago.monto_letras}</p>
          </div>

          <div className="recibo-linea" />

          {/* Firmas */}
          <div className="recibo-firmas">
            {/* <div className="recibo-firma"> */}
              {/* <div className="recibo-firma-linea" /> */}
              {/* <p>Firma del Asociado</p> */}
            {/* </div> */}
            <div className="recibo-firma">
              <div className="recibo-firma-linea" />
              <p>Sello y Firma Administración</p>
            </div>
          </div>
        </div>
      </div>

      {mode === "media" && (
        <div className="recibo-corte" aria-hidden="true">
          <span>Recortar aquí · límite de media hoja tamaño carta</span>
        </div>
      )}
    </div>
  );
}
