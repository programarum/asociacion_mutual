import { useEffect, useState } from "react";

export function useRole() {
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    setRole(userRole);
    setIsLoading(false);
  }, []);

  const isAdmin = role === "admin";
  const isUser = role === "user";

  return { role, isAdmin, isUser, isLoading };
}
