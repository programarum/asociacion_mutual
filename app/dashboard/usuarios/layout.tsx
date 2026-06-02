"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "../../../hooks/useRole";

export default function UsuariosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAdmin, isLoading } = useRole();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading || !isAdmin) return null;

  return <>{children}</>;
}
