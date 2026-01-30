
import { Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute from "./components/ProtectedRoute"

import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import Inicio from "./pages/dashboard/Inicio"

import Logistica from "./pages/dashboard/logistica/Fletes"
import EstadisticaFletes from "./pages/dashboard/logistica/EstadisticaFletes"

import Proveedores from "./pages/dashboard/reportes/Proveedores"
import Ventas from "./pages/dashboard/reportes/Ventas"
import Saldos from "./pages/dashboard/reportes/Saldos"
import Ejemplo from "./pages/dashboard/reportes/Ejemplo"

import Usuarios from "./pages/dashboard/configuracion/Usuarios"
import Empresas from "./pages/dashboard/configuracion/Empresas"
import UsuarioNuevo from "./pages/dashboard/configuracion/UsuarioNuevo"
import EditarUsusario from "./pages/dashboard/configuracion/UsuarioEditar"

import Arqueo from "./pages/dashboard/finanzas/Arqueo"
import Calendar from "./pages/dashboard/finanzas/Calendar"
import InformeEfectivo from "./pages/dashboard/finanzas/InformeEfectivo"
import BuscarFlujoEfectivo from "./pages/dashboard/finanzas/BuscarFlujoEfectivo"
import SolicitudesCrear from "./pages/dashboard/solicitudes/crear"
import ConsultaPagos from "./pages/dashboard/solicitudes/consulta"

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
        /***finanzas */
        <Route path="finanzas/" element={<Arqueo />} /> 
        <Route path="finanzas/calendar" element={<Calendar />} />
        <Route path="finanzas/arqueo/:date/:empresaId" element={<Arqueo />} />
        <Route path="finanzas/arqueo" element={<Arqueo />} />
        <Route path="finanzas/informe-efectivo" element={<InformeEfectivo />} />
        <Route path="finanzas/buscar-informe-efectivo" element={<BuscarFlujoEfectivo />} />
        /***reportes */
        <Route path="reportes/proveedores" element={<Proveedores />} />
        <Route path="reportes/ventas" element={<Ventas />} />
        <Route path="reportes/saldos" element={<Saldos />} />
        <Route path="reportes/ejemplo" element={<Ejemplo />} />
        <Route path="reportes/" element={<Proveedores />} />
        /***configuracion */
        <Route path="configuracion/usuarios" element={<Usuarios />} />
        <Route path="configuracion/empresas" element={<Empresas />} />
        <Route path="configuracion/UsuarioNuevo" element={<UsuarioNuevo />} />
        <Route path="configuracion/UsuarioEditar/:id" element={<EditarUsusario />} />
        /***logistica */       
        <Route path="logistica/*" element={<Logistica />} />   
        <Route path="logistica/reporte-fletes" element={<EstadisticaFletes />} />    
        {/* Solicitudes */}
        <Route path="solicitudes/crear" element={<SolicitudesCrear />} />
        <Route path="solicitudes/consulta" element={<ConsultaPagos />} />
        
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
