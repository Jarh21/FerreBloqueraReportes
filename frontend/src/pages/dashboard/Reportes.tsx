import { Routes, Route } from "react-router-dom"
import Proveedores from "./reportes/Proveedores"
import Ventas from "./reportes/Ventas"
import Saldos from "./reportes/Saldos"
import Ejemplo from "./reportes/Ejemplo"

export default function Reportes() {
  return (
    <Routes>
      <Route path="/proveedores" element={<Proveedores />} />
      <Route path="/ventas" element={<Ventas />} />
      <Route path="/saldos" element={<Saldos />} />
      <Route path="/ejemplo" element={<Ejemplo />} />
      <Route path="/" element={<Proveedores />} />
    </Routes>
  )
}
