import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import { useRole } from "./hooks/useRole";
import AuthService from "./services/AuthService";

import Login from "./pages/login";
import ActivacionPage from "./pages/activacion";
import Dashboard from "./pages/dashboard";
import Asociados from "./pages/asociados";
import Usuarios from "./pages/usuarios";
import Setting from "./pages/setting";
import Fallecidos from "./pages/fallecidos";
import Backup from "./pages/backup";

function DashboardLayout() {
  const navigate = useNavigate();
  const { isLoading } = useRole();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/activacion" element={<ActivacionPage />} />
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/asociados" element={<Asociados />} />
        <Route path="/dashboard/usuarios" element={<Usuarios />} />
        <Route path="/dashboard/setting" element={<Setting />} />
        <Route path="/dashboard/fallecidos" element={<Fallecidos />} />
        <Route path="/dashboard/backup" element={<Backup />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
