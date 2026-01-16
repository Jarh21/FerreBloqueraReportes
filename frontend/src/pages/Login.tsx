"use client"

import type React from "react"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Login() {
  const [email, setEmail] = useState("")
  const [contraseña, setContraseña] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login(email, contraseña)
      navigate("/dashboard")
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
  <div className="bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row w-full max-w-4xl overflow-hidden border border-slate-100">
    
    {/* Panel Izquierdo: Branding e Imagen */}
    <div className="relative w-full md:w-1/2 bg-red-700 p-12 text-white flex flex-col justify-between overflow-hidden">
      {/* Círculo decorativo de fondo */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-red-600 rounded-full opacity-50"></div>
      
      <div className="relative z-10">
        <img 
          src="/public/image/logo_san_juan.jpg" 
          alt="Grupo San Juan Logo" 
          className="w-24 h-24 bg-white p-2 rounded-xl shadow-lg mb-6"
        />
        <h1 className="text-3xl font-extrabold tracking-tight">GRUPO <br/>SAN JUAN</h1>
        <div className="h-1 w-12 bg-yellow-300 mt-4 rounded-full"></div>
      </div>

      <div className="relative z-10 mt-8">
        <p className="text-red-100 text-lg italic">"En Dios Confiamos"</p>
        <div className="mt-6 flex gap-2">
           <span className="text-xs bg-red-800/50 px-3 py-1 rounded-full border border-red-500/30">Sede Ferre-Hierro</span>
           <span className="text-xs bg-red-800/50 px-3 py-1 rounded-full border border-red-500/30">Ferre-Bloquera</span>
        </div>
      </div>

      {/* Imagen sutil de fondo para textura */}
      <div className="absolute bottom-0 right-0 opacity-20 grayscale">
         {/* Aquí podrías poner una silueta del edificio de la imagen 'fhierro.jpg' */}
      </div>
    </div>

    {/* Panel Derecho: Formulario */}
    <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
      <div className="mb-10 text-center md:text-left">
        <h2 className="text-2xl font-bold text-slate-800">Bienvenido de nuevo</h2>
        <p className="text-slate-500">Ingresa tus credenciales para acceder al sistema</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-700 text-red-800 p-4 rounded-r-lg mb-6 flex items-center gap-3 animate-shake">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Corporativo</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" /></svg>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-700 focus:border-yellow-300 outline-none transition-all placeholder:text-slate-300"
              placeholder="usuario@gruposanjuan.com"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 118 0v4" /></svg>
            </span>
            <input
              type="password"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-700 focus:border-yellow-300 outline-none transition-all placeholder:text-slate-300"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              <span>Iniciar Sesión</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </>
          )}
        </button>
      </form>

      <footer className="mt-12 text-center">
        <p className="text-xs text-slate-400 font-medium italic">
          &copy; {new Date().getFullYear()} Grupo San Juan. San Fernando de Apure.
        </p>
      </footer>
    </div>
  </div>
</div>
  )
}
