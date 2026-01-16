
import { Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute from "./components/ProtectedRoute"

import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import Inicio from "./pages/dashboard/Inicio"
import Finanzas from "./pages/dashboard/Finanzas"
import Reportes from "./pages/dashboard/Reportes"
import Configuracion from "./pages/dashboard/Configuracion"
import Logistica from "./pages/dashboard/logistica/Fletes"
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<Inicio />} />
        <Route path="finanzas/*" element={<Finanzas />} />
        <Route path="logistica/*" element={<Logistica />} />        
        <Route path="reportes/*" element={<Reportes />} />
        <Route path="configuracion/*" element={<Configuracion />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
