"use client"
import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import axios from "axios"
import { buildApiUrl } from '../../config/api';

interface Saldo {
  Tipo_Cuenta:String
  Total_VES_USD: String
  Dolares_BCV: String
  Dolares_Paralelo: String
}

export default function Inicio() {
  const { usuario, empresaActual, empresas } = useAuth()
  const [saldos, setSaldos] = useState<Saldo[]>([])

   useEffect(() => {
    saldoPorEmpresa()
  }, [])

  const saldoPorEmpresa = async ()=>{
    try {
      const response = await axios.get(buildApiUrl(`/reportes/total-saldo/${empresaActual?.id}`), {
        withCredentials: true,
      })
      setSaldos(response.data);
      console.log("Saldo Total:", saldos);
    } catch (err) {
      console.error(`Error al obtener el saldo de la empresa`, err);
    }
  }



  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-8xl mx-auto">
        {/* Banner de Bienvenida Estilizado */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Bienvenido de nuevo, <span className="text-primary-600">{usuario?.nombre}</span>
            </h1>
            <div className="flex items-center gap-2 mt-2 text-slate-500 font-medium">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Empresa actual: <span className="text-slate-700 font-bold">{empresaActual?.nombre}</span>
            </div>
          </div>
          {/* Decoración sutil de fondo */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary-50 rounded-full blur-3xl"></div>
        </div>

        {/* Grid Configurable: De 2 en 2 en Desktop (se adapta si hay 4, 5 o más) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {empresas.map((empresa) => (
            <div 
              key={empresa.id} 
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Cabecera de la Tarjeta */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  {empresa.nombre}
                </h3>
                <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-400 uppercase tracking-widest">
                  Finanzas
                </span>
              </div>

              <div className="p-6">
                {/* Contenedor de Saldos */}
                <div className="grid grid-cols-1 gap-4">
                  {saldos.map((saldo, index) => (
                    <div 
                      key={index} 
                      className="group bg-slate-50/50 hover:bg-primary-50/30 border border-slate-100 rounded-xl p-4 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                          {saldo.Tipo_Cuenta}
                        </span>
                        <span className="text-lg font-black text-slate-800">
                          {saldo.Total_VES_USD} <span className="text-[10px] text-slate-400 font-medium">VES</span>
                        </span>
                      </div>

                      {/* Detalle de Tasas */}
                      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Tasa BCV</span>
                          <span className="text-sm font-bold text-emerald-600">
                            {saldo.Dolares_BCV} <span className="text-[10px] opacity-70">VES</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Paralelo</span>
                          <span className="text-sm font-bold text-amber-600">
                            {saldo.Dolares_Paralelo} <span className="text-[10px] opacity-70">VES</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer de Tarjeta opcional */}
              <div className="px-6 py-3 bg-slate-50/30 text-[10px] text-slate-400 text-center italic">
                Valores actualizados según tasa del día
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
