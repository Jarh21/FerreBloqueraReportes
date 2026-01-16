import { Routes, Route } from "react-router-dom"
import Usuarios from "./configuracion/Usuarios"
import Empresas from "./configuracion/Empresas"
import UsuarioNuevo from "./configuracion/UsuarioNuevo"
import EditarUsusario from "./configuracion/UsuarioEditar"

export default function Configuracion() {
  return (
    <Routes>
      <Route path="usuarios" element={<Usuarios />} />
      <Route path="empresas" element={<Empresas />} />
      <Route path="UsuarioNuevo" element={<UsuarioNuevo />} />
      <Route path="UsuarioEditar/:id" element={<EditarUsusario />} />
      <Route index element={<Usuarios />} />
    </Routes>
  )
}
