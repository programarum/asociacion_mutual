import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthService from "../services/AuthService";

export function useAuth() {
  const router = useRouter();

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      router.push("/");
    }
  }, [router]);

  return {
    user: AuthService.getCurrentUser(),
    isAuthenticated: AuthService.isAuthenticated(),
    logout: async () => {
      await AuthService.logout();
      router.push("/");
    },
  };
}
