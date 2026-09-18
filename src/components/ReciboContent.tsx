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
import pieImg from "../assets/recibos/logo_pie.png";

interface ReciboContentProps {
  data: ComprobanteData;
}

export default function ReciboContent({ data }: ReciboContentProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const pieRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<ModoHoja>("auto");
  const [spacer, setSpacer] = useState(0);

  useLayoutEffect(() => {
    const bodyEl = bodyRef.current;
    const pieEl = pieRef.current;
    if (!bodyEl || !pieEl) return;

    const measure = () => {
      const bodyH = bodyEl.getBoundingClientRect().height / MM;
      const pieH = pieEl.getBoundingClientRect().height / MM;
      const { mode: m, spacer: s } = decidirDisposicion(bodyH, pieH);
      setMode(m);
      setSpacer(s);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(bodyEl);
    ro.observe(pieEl);
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

        /* Encabezado: logo + datos empresa */
        .recibo-header {
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 2px solid #1e3a8a;
          padding-bottom: 4px;
          margin-bottom: 6px;
        }
        .recibo-logo {
          width: 18mm;
          height: 18mm;
          object-fit: contain;
          flex: none;
        }
        .recibo-empresa {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .empresa-nombre {
          font-size: 15px;
          font-weight: 700;
          text-transform: uppercase;
          color: #1e3a8a;
          line-height: 1.15;
        }
        .empresa-dato {
          font-size: 10px;
          line-height: 1.3;
          color: #222;
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
          padding: 6px 8px;
          margin-top: 8px;
        }
        .recibo-valor-top {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .recibo-valor-monto { font-size: 16px; font-weight: 700; }
        .recibo-valor-letras { font-size: 10px; font-style: italic; margin-top: 2px; }
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

        /* Pie */
        .recibo-pie {
          flex: none;
          display: flex;
          justify-content: center;
        }
        .recibo-pie-img {
          display: block;
          width: 80%;
          height: auto;
        }

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
            <div className="recibo-empresa">
              <p className="empresa-nombre">{nombreEmpresa}</p>
              {empresa?.ruc ? (
                <p className="empresa-dato">NIT: {empresa.ruc}</p>
              ) : null}
              {empresa?.direccion ? (
                <p className="empresa-dato">Dir.: {empresa.direccion}</p>
              ) : null}
              {empresa?.telefono1 || empresa?.telefono2 ? (
                <p className="empresa-dato">
                  Tel.:{" "}
                  {[empresa?.telefono1, empresa?.telefono2]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
              {empresa?.whatsapp ? (
                <p className="empresa-dato">WhatsApp: {empresa.whatsapp}</p>
              ) : null}
              {empresa?.email ? (
                <p className="empresa-dato">Email: {empresa.email}</p>
              ) : null}
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

        {/* Pie de página */}
        <div
          ref={pieRef}
          className="recibo-pie"
          style={{ marginTop: `${spacer}mm` }}
        >
          <img src={pieImg} alt="Pie de página" className="recibo-pie-img" />
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
