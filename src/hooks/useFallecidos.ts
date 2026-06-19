import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";

export interface Fallecido {
  id: number;
  tipo: "asociado" | "beneficiario";
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  documento: string;
  fecha_fallecimiento: string;
  fecha_afiliacion?: string;
  asociado_origen_id?: number;
  parentesco?: string;
  sexo?: string;
  created_at?: string;
}

export interface FallecidosPaginatedResponse {
  data: Fallecido[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

interface UseFallecidosOptions {
  search?: string;
  enabled?: boolean;
}

export function useFallecidos(options: UseFallecidosOptions = {}) {
  const { search, enabled = true } = options;

  return useQuery({
    queryKey: ["fallecidos", search],
    queryFn: async (): Promise<FallecidosPaginatedResponse> => {
      return await invoke("list_fallecidos", { search: search || null });
    },
    enabled,
  });
}

export function useMarcarAsociadoFallecido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      asociadoId,
      beneficiarioId,
      fechaFallecimiento,
    }: {
      asociadoId: number;
      beneficiarioId: number;
      fechaFallecimiento: string;
    }) => {
      return await invoke("marcar_asociado_fallecido", {
        asociadoId,
        req: { beneficiarioId, fechaFallecimiento },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fallecidos"] });
      queryClient.invalidateQueries({ queryKey: ["asociados"] });
    },
  });
}

export function useMarcarBeneficiarioFallecido(asociadoId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      beneficiarioId,
      fechaFallecimiento,
    }: {
      beneficiarioId: number;
      fechaFallecimiento: string;
    }) => {
      return await invoke("marcar_beneficiario_fallecido", {
        asociadoId,
        beneficiarioId,
        req: { fechaFallecimiento },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fallecidos"] });
      queryClient.invalidateQueries({ queryKey: ["beneficiarios", asociadoId] });
    },
  });
}
