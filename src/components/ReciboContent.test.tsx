import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ReciboContent from "./ReciboContent";
import { decidirDisposicion } from "./reciboLayout";
import type { ComprobanteData } from "../hooks/useComprobante";

const base: ComprobanteData = {
  recibo_numero: 42,
  asociado: {
    codigo: "A001",
    nombre_completo: "Juan Pérez",
    documento: "0912345678",
  },
  beneficiarios: [],
  pago: {
    id: 7,
    meses_pagados: 2,
    monto: 40,
    monto_formateado: "$40,00",
    monto_letras: "cuarenta dólares con 00/100",
    fecha_pago: "2026-09-01",
    mes_desde: "2026-09-01",
    mes_hasta: "2026-10-31",
    meses_cubiertos: [
      { mes: "Sep", ano: 2026, label: "Sep 2026" },
      { mes: "Oct", ano: 2026, label: "Oct 2026" },
    ],
  },
  configuracion: { cuota_mensual: 15, cuota_administracion: 10 },
  empresa: {
    nombre: "Mutual Los Andes",
    ruc: "0990000000000",
    direccion: "Av. Principal 123",
    telefono1: "0999-111-222",
    telefono2: "0988-333-444",
    whatsapp: "0997-555-666",
    email: "mutual@ejemplo.com",
  },
  fecha_impresion: "2026-09-18",
};

describe("decidirDisposicion", () => {
  it("usa media hoja cuando el contenido cabe arriba", () => {
    const { mode, spacer } = decidirDisposicion(70, 26);
    expect(mode).toBe("media");
    expect(spacer).toBeGreaterThan(0);
  });

  it("usa hoja completa cuando no cabe en la mitad", () => {
    const { mode } = decidirDisposicion(150, 26);
    expect(mode).toBe("entera");
  });

  it("desborda a más hojas cuando no cabe en una carta completa", () => {
    const { mode, spacer } = decidirDisposicion(250, 26);
    expect(mode).toBe("overflow");
    expect(spacer).toBe(0);
  });
});

describe("ReciboContent", () => {
  it("muestra logo, datos de empresa, recibo y asociado", () => {
    const { container } = render(<ReciboContent data={base} />);
    expect(screen.getByText("Mutual Los Andes")).toBeInTheDocument();
    expect(screen.getByText(/NIT: 0990000000000/)).toBeInTheDocument();
    expect(
      screen.getByText(/Tel\.:\s*0999-111-222 · 0988-333-444/)
    ).toBeInTheDocument();
    expect(screen.getByText(/WhatsApp: 0997-555-666/)).toBeInTheDocument();
    expect(screen.getByText(/Recibo de Pago N° 42/)).toBeInTheDocument();
    expect(screen.getByText(/Juan Pérez/)).toBeInTheDocument();
    expect(
      container.querySelector('img[src*="logo"]')
    ).toBeInTheDocument();
  });

  it("no renderiza la tabla si no hay beneficiarios", () => {
    const { container } = render(<ReciboContent data={base} />);
    expect(container.querySelector("table")).toBeNull();
  });

  it("renderiza una fila por beneficiario", () => {
    const data: ComprobanteData = {
      ...base,
      beneficiarios: [
        { id: 1, nombre_completo: "Ana Pérez", parentesco: "Hija", documento: "091" },
        { id: 2, nombre_completo: "Bea Pérez", parentesco: "Hija", documento: "092" },
        { id: 3, nombre_completo: "Ceo Pérez", parentesco: "Hijo", documento: "093" },
      ],
    };
    const { container } = render(<ReciboContent data={data} />);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(3);
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
  });
});
