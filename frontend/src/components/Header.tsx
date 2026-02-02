"use client"

import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { usuario, empresas, empresaActual, setEmpresaActual, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }
  const version= "v1.6"
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-6 h-20">
      <div className="flex items-center justify-between h-full">
        
        {/* Izquierda: Logo y Toggle */}
        <div className="flex items-center gap-6">
          <button 
            onClick={onMenuClick} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
          >
            <svg xmlns="www.w3.org" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex flex-col -space-y-1">
            <h1 className="text-xl font-black tracking-tighter">
              <span className="text-rose-600 uppercase">Grupo</span>
              <span className="text-slate-800 uppercase ml-1">San Juan </span>
              <span className="text-rose-600 ">{version}</span>
            </h1>
            {empresaActual && (
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-0.5">
                {empresaActual.nombre}
              </span>
            )}
          </div>
        </div>

        {/* Derecha: Selector, Perfil y Logout */}
        <div className="flex items-center gap-4">
          
          {/* Selector de Empresa mejorado */}
          <div className="relative hidden lg:block">
            <select
              value={empresaActual?.id || ""}
              onChange={(e) => {
                const id = parseInt(e.target.value, 10);
                const empresa = empresas.find((emp) => emp.id === id);
                if (empresa) setEmpresaActual(empresa);
              }}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer font-medium transition-all"
            >

              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  🏢 {empresa.nombre}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M7 10l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Perfil de Usuario */}
          <div className="h-10 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block leading-tight">
              <p className="font-bold text-slate-800 text-sm">{usuario?.nombre || 'Usuario'}</p>
              <p className="text-[11px] font-bold text-primary-600 uppercase tracking-tighter">
                {usuario?.role_nombre || 'Rol'}
              </p>
            </div>
            
            {/* Avatar Placeholder */}
            <div className="w-10 h-10 bg-gradient-to-tr from-slate-200 to-slate-300 rounded-full flex items-center justify-center font-bold text-slate-600 shadow-inner">
              {usuario?.nombre?.charAt(0) || 'U'}
            </div>

            <button
              onClick={handleLogout}
              className="ml-2 p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 group"
              title="Cerrar Sesión"
            >
              <svg xmlns="www.w3.org" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
