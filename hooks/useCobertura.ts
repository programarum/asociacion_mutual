import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

export interface Cobertura {
  id: number;
  asociado_id: number;
  fecha_inicio: string | null;
  mes_pagado_hasta: string | null;
  estado: "vigente" | "moroso";
}

export interface CoberturaResponse {
  cobertura: Cobertura | null;
  estado: "vigente" | "moroso";
  max_meses_pagables: number;
  cuota_mensual: number;
  cuota_administracion: number;
  beneficiarios_count: number;
  personas: number;
  monto_por_mes: number;
}

interface UseCoberturaOptions {
  asociadoId?: number;
  enabled?: boolean;
}

export function useCobertura({ asociadoId, enabled = true }: UseCoberturaOptions) {
  return useQuery({
    queryKey: ["cobertura", asociadoId],
    queryFn: async (): Promise<CoberturaResponse> => {
      const response = await api.get(`/asociados/${asociadoId}/cobertura`);
      return response.data;
    },
    enabled: !!asociadoId && enabled,
  });
}
