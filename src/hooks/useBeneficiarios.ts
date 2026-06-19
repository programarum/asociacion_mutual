import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";

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
  enabled?: boolean;
}

export function useBeneficiarios(options: UseBeneficiariosOptions = {}) {
  const { asociadoId, enabled = true } = options;

  return useQuery({
    queryKey: ["beneficiarios", asociadoId],
    queryFn: async (): Promise<BeneficiariosPaginatedResponse> => {
      return await invoke("list_beneficiarios", { asociadoId });
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
      return await invoke("create_beneficiario", { asociadoId, req: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beneficiarios", asociadoId] });
    },
  });
}

export function useUpdateBeneficiario(asociadoId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BeneficiarioInput> }) => {
      return await invoke("update_beneficiario", { asociadoId, id, req: data });
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
      await invoke("delete_beneficiario", { asociadoId, id });
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
      return await invoke("transfer_and_delete", { asociadoId, beneficiarioId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beneficiarios", asociadoId] });
      queryClient.invalidateQueries({ queryKey: ["asociados"] });
    },
  });
}
