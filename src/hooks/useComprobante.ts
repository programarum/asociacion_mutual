import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";

export interface MesCubierto {
  mes: string;
  ano: number;
  label: string;
}

export interface ComprobanteBeneficiario {
  id: number;
  nombre_completo: string;
  parentesco: string;
  documento: string;
}

export interface ComprobanteData {
  recibo_numero: number;
  asociado: {
    codigo: string;
    nombre_completo: string;
    documento: string;
  };
  beneficiarios: ComprobanteBeneficiario[];
  pago: {
    id: number;
    meses_pagados: number;
    monto: number;
    monto_formateado: string;
    monto_letras: string;
    fecha_pago: string;
    mes_desde: string;
    mes_hasta: string;
    meses_cubiertos: MesCubierto[];
  };
  configuracion: {
    cuota_mensual: number;
    cuota_administracion: number;
  };
  fecha_impresion: string;
}

interface UseComprobanteOptions {
  asociadoId?: number;
  pagoId?: number;
  enabled?: boolean;
}

export function useComprobante({
  asociadoId,
  pagoId,
  enabled = true,
}: UseComprobanteOptions) {
  return useQuery({
    queryKey: ["comprobante", asociadoId, pagoId],
    queryFn: async (): Promise<ComprobanteData> => {
      return await invoke("get_comprobante", { asociadoId, pagoId });
    },
    enabled: !!asociadoId && !!pagoId && enabled,
  });
}
