import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

export interface Configuracion {
  id: number;
  cuota_mensual: string;
  cuota_administracion: string;
}

export function useConfiguracion() {
  return useQuery({
    queryKey: ["configuracion"],
    queryFn: async (): Promise<Configuracion> => {
      const response = await api.get("/configuracion");
      return response.data;
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
      const response = await api.put("/configuracion", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracion"] });
    },
  });
}
