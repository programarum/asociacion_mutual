"use client";

import Link from "next/link";
import { Cog, Menu, X, UserPlus, ShieldUser } from "lucide-react";
import { useRole } from "../../hooks/useRole";
import { useEffect, useState } from "react";
import api from "@/services/api";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
  asociadosCount: number;
}

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
}: SidebarProps) {
  const { isAdmin, isLoading } = useRole();

 const [asociadosCount, setAsociadosCount] = useState(0) ;

    useEffect(() => {
    const fetchAsociadosCount = async () => {
      try {
        const response = await api.get("/asociados");
        setAsociadosCount(response.data.length);
      } catch (error) {
        console.error("Error fetching asociados:", error);
      }
    };

    fetchAsociadosCount();
  }, []);

 
  if (isLoading) return null;


  return (
    <div
      className={`${
        sidebarOpen ? "w-64" : "w-20"
      } bg-stone-800 text-white transition-all duration-300 ease-in-out flex flex-col`}
    >
      {/* Logo/Header */}
      <div className="p-6 border-b border-stone-700">
        <h1 className={`font-bold text-xl ${!sidebarOpen && "hidden"}`}>
          Mutual
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {/* Asociados - Visible para todos */}
        <Link
          href="/dashboard/asociados"
          className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-stone-700 transition-colors"
        >
          <ShieldUser className="w-5 h-5 shrink-0" />
          {sidebarOpen && (
            <div className="flex-1">
              <p className="font-medium">Asociados</p>
              <p className="text-xs text-stone-400">{asociadosCount} registrados</p>
            </div>
          )}
        </Link>

        {/* Usuarios - Solo Admin */}
        {isAdmin && (
          <Link
            href="/dashboard/usuarios"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-stone-700 transition-colors"
          >
            <UserPlus className="w-5 h-5 shrink-0" />
            {sidebarOpen && (
              <div className="flex-1">
                <p className="font-medium">Usuarios</p>
                <p className="text-xs text-stone-400">{asociadosCount} registrados</p>
              </div>
            )}
          </Link>
        )}

        {/* Configuración - Solo Admin */}
        {isAdmin && (
          <Link
            href="/dashboard/setting"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-stone-700 transition-colors"
          >
            <Cog className="w-5 h-5 shrink-0" />
            {sidebarOpen && (
              <div className="flex-1">
                <p className="font-medium">Configuración</p>
              </div>
            )}
          </Link>
        )}
      </nav>

      {/* Toggle Button */}
      <div className="p-4 border-t border-stone-700">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-stone-700 transition-colors"
        >
          {sidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
