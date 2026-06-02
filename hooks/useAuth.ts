import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("authToken");

    if (!isAuthenticated) {
      router.push("/");
    }
  }, [router]);

  return {
    logout: () => {
      localStorage.removeItem("authToken");
      router.push("/");
    },
  };
}
