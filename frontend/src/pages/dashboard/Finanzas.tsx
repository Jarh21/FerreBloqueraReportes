import { Routes, Route } from "react-router-dom"
import Arqueo from "./finanzas/Arqueo"
import Calendar from "./finanzas/Calendar"
import InformeEfectivo from "./finanzas/InformeEfectivo"
import BuscarFlujoEfectivo from "./finanzas/BuscarFlujoEfectivo"
export default function Finanzas() {
  return (
    <Routes>
      <Route path="calendar" element={<Calendar />} />
      <Route path="arqueo/:date/:empresaId" element={<Arqueo />} />
      <Route path="arqueo" element={<Arqueo />} />
      <Route path="informe-efectivo" element={<InformeEfectivo />} />
      <Route path="buscar-informe-efectivo" element={<BuscarFlujoEfectivo />} />
      <Route path="" element={<Arqueo />} />
    </Routes>
  )
}
