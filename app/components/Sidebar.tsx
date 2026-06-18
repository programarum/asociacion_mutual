"use client";

import Link from "next/link";
import {
  Cog,
  Menu,
  X,
  UserPlus,
  ShieldUser,
  LayoutDashboard,
  Skull,
  DatabaseBackup,
} from "lucide-react";
import { useRole } from "../../hooks/useRole";
import { useAsociados } from "../../hooks/useAsociados";
import { useUsers } from "../../hooks/useUsers";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const { isAdmin, isLoading: roleLoading } = useRole();

  // Fetch counts; cached by React Query
  const { data: asociadosData, isLoading: asociadosLoading } = useAsociados({
    perPage: 1,
    enabled: !roleLoading,
  });
  const { data: usersData, isLoading: usersLoading } = useUsers({
    perPage: 1,
    enabled: !roleLoading && isAdmin,
  });
  const asociadosCount = asociadosData?.total ?? 0;
  const userCount = usersData?.total ?? 0;

  if (roleLoading || asociadosLoading || usersLoading) return null;

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
        {/* dashboard */}
        <Link
          href="/dashboard"
          className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-stone-700 transition-colors"
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          {sidebarOpen && (
            <div className="flex-1">
              <p className="font-medium">DashBoard</p>
            </div>
          )}
        </Link>
        {/* Asociados - Visible para todos */}
        <Link
          href="/dashboard/asociados"
          className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-stone-700 transition-colors"
        >
          <ShieldUser className="w-5 h-5 shrink-0" />
          {sidebarOpen && (
            <div className="flex-1">
              <p className="font-medium">Asociados</p>
              <p className="text-xs text-stone-400">
                {asociadosCount} registrados
              </p>
            </div>
          )}
        </Link>

        {/* Fallecidos - Solo Admin */}
        {isAdmin && (
          <Link
            href="/dashboard/fallecidos"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-stone-700 transition-colors"
          >
            <Skull className="w-5 h-5 shrink-0" />
            {sidebarOpen && (
              <div className="flex-1">
                <p className="font-medium">Fallecidos</p>
              </div>
            )}
          </Link>
        )}

        {/* Usuarios - Solo Admin (UI hint only; backend verifies actual permissions) */}
        {isAdmin && (
          <Link
            href="/dashboard/usuarios"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-stone-700 transition-colors"
          >
            <UserPlus className="w-5 h-5 shrink-0" />
            {sidebarOpen && (
              <div className="flex-1">
                <p className="font-medium">Usuarios</p>
                <p className="text-xs text-stone-400">
                  {userCount} registrados
                </p>
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

        {/* Copia de Seguridad - Solo Admin */}
        {isAdmin && (
          <Link
            href="/dashboard/backup"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-stone-700 transition-colors"
          >
            <DatabaseBackup className="w-5 h-5 shrink-0" />
            {sidebarOpen && (
              <div className="flex-1">
                <p className="font-medium">Copia de Seguridad</p>
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
