import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";

export interface Asociado {
  id: number;
  codigo: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  documento: string;
  email: string;
  telefono: string;
  direccion: string;
  mes_actual?: string;
  mese_pagados?: string;
  gran_total?: string;
  created_at?: string;
  updated_at?: string;
  beneficiarios?: unknown[];
  cobertura?: unknown;
}

export interface PaginatedResponse {
  data: Asociado[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

interface UseAsociadosOptions {
  search?: string;
  enabled?: boolean;
}

export function useAsociados(options: UseAsociadosOptions = {}) {
  const { search, enabled = true } = options;

  return useQuery({
    queryKey: ["asociados", search],
    queryFn: async (): Promise<PaginatedResponse> => {
      return await invoke("list_asociados", { search: search || null });
    },
    enabled,
  });
}
