import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

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
  datos_extras?: {
    email?: string;
    telefono?: string;
    direccion?: string;
    codigo?: string;
  };
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
      const params = search ? { search } : {};
      const response = await api.get("/fallecidos", { params });
      return response.data;
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
      const response = await api.post(`/asociados/${asociadoId}/fallecer`, {
        beneficiario_id: beneficiarioId,
        fecha_fallecimiento: fechaFallecimiento,
      });
      return response.data;
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
      const response = await api.post(
        `/asociados/${asociadoId}/beneficiarios/${beneficiarioId}/fallecer`,
        { fecha_fallecimiento: fechaFallecimiento }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fallecidos"] });
      queryClient.invalidateQueries({ queryKey: ["beneficiarios", asociadoId] });
    },
  });
}
