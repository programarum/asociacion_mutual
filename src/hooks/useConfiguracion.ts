import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";

export interface Configuracion {
  id: number;
  cuota_mensual: number;
  cuota_administracion: number;
}

export function useConfiguracion() {
  return useQuery({
    queryKey: ["configuracion"],
    queryFn: async (): Promise<Configuracion> => {
      return await invoke("get_configuracion");
    },
  });
}

interface ConfiguracionInput {
  cuota_mensual: number;
  cuota_administracion: number;
}

export function useUpdateConfiguracion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ConfiguracionInput) => {
      return await invoke("update_configuracion", { req: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracion"] });
    },
  });
}
