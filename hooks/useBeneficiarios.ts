import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

export interface Beneficiario {
  id: number;
  asociado_id: number;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  documento: string;
  fecha_nacimiento: string;
  parentesco: string;
  sexo: string;
  fecha_afiliacion: string;
  created_at?: string;
}

export interface BeneficiariosPaginatedResponse {
  data: Beneficiario[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

interface UseBeneficiariosOptions {
  asociadoId?: number;
  page?: number;
  perPage?: number;
  enabled?: boolean;
}

export function useBeneficiarios(options: UseBeneficiariosOptions = {}) {
  const { asociadoId, page = 1, perPage = 50, enabled = true } = options;

  return useQuery({
    queryKey: ["beneficiarios", asociadoId, { page, perPage }],
    queryFn: async (): Promise<BeneficiariosPaginatedResponse> => {
      const response = await api.get(
        `/asociados/${asociadoId}/beneficiarios`,
        { params: { page, per_page: perPage } }
      );
      return response.data;
    },
    enabled: !!asociadoId && enabled,
  });
}

interface BeneficiarioInput {
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  documento: string;
  fecha_nacimiento: string;
  parentesco: string;
  sexo: string;
  fecha_afiliacion: string;
}

export function useCreateBeneficiario(asociadoId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: BeneficiarioInput) => {
      const response = await api.post(
        `/asociados/${asociadoId}/beneficiarios`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beneficiarios", asociadoId] });
    },
  });
}

export function useUpdateBeneficiario(asociadoId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<BeneficiarioInput>;
    }) => {
      const response = await api.put(
        `/asociados/${asociadoId}/beneficiarios/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beneficiarios", asociadoId] });
    },
  });
}

export function useDeleteBeneficiario(asociadoId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/asociados/${asociadoId}/beneficiarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beneficiarios", asociadoId] });
    },
  });
}

export function useTransferAndDelete(asociadoId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (beneficiarioId: number) => {
      const response = await api.post(`/asociados/${asociadoId}/transfer`, {
        beneficiario_id: beneficiarioId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beneficiarios", asociadoId] });
      queryClient.invalidateQueries({ queryKey: ["asociados"] });
    },
  });
}
