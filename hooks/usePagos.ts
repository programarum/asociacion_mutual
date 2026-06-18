import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

export interface Pago {
  id: number;
  asociado_id: number;
  meses_pagados: number;
  monto: string;
  fecha_pago: string;
  mes_desde: string;
  mes_hasta: string;
  created_at?: string;
}

export interface PagosPaginatedResponse {
  data: Pago[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

interface UsePagosOptions {
  asociadoId?: number;
  enabled?: boolean;
}

export function usePagos({ asociadoId, enabled = true }: UsePagosOptions) {
  return useQuery({
    queryKey: ["pagos", asociadoId],
    queryFn: async (): Promise<PagosPaginatedResponse> => {
      const response = await api.get(`/asociados/${asociadoId}/pagos`);
      return response.data;
    },
    enabled: !!asociadoId && enabled,
  });
}

export function useCreatePago(asociadoId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (meses: number) => {
      const response = await api.post(`/asociados/${asociadoId}/pagos`, {
        meses,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pagos", asociadoId] });
      queryClient.invalidateQueries({ queryKey: ["cobertura", asociadoId] });
      queryClient.invalidateQueries({ queryKey: ["asociados"] });
    },
  });
}
