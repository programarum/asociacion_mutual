import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";

export interface Pago {
  id: number;
  asociado_id: number;
  meses_pagados: number;
  monto: number;
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
      return await invoke("list_pagos", { asociadoId });
    },
    enabled: !!asociadoId && enabled,
  });
}

export function useCreatePago(asociadoId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (meses: number) => {
      return await invoke("create_pago", { asociadoId, meses });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pagos", asociadoId] });
      queryClient.invalidateQueries({ queryKey: ["cobertura", asociadoId] });
      queryClient.invalidateQueries({ queryKey: ["asociados"] });
    },
  });
}
