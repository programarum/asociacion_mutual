"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import ConnectionErrorBanner from "../components/ConnectionErrorBanner";
import { useState } from "react";
import { useRole } from "../../hooks/useRole";
import AuthService from "../../services/AuthService";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isLoading } = useRole();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      router.push("/");
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <ConnectionErrorBanner />
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
