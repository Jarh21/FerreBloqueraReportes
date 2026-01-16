"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import axios from "axios"
import { buildApiUrl } from '../config/api';
interface Usuario {
  id: number
  nombre: string
  email: string
  role_id: number
  role_nombre: string
}

interface Empresa {
  id: number
  nombre: string
  ruc?: string
  direccion?: string
  telefono?: string
  email?: string
  ciudad?: string
}

interface Modulos {
  id: number
  nombre: string
}

interface AuthContextType { 
  usuario: Usuario | null
  empresas: Empresa[]
  modulos: Modulos[]
  validarModulo: (moduloNombre: string) => boolean
  empresaActual: Empresa | null
  setEmpresaActual: (empresa: Empresa | null) => void
  loading: boolean
  login: (email: string, contraseña: string) => Promise<void>
  logout: () => Promise<void>
  register: (nombre: string, email: string, contraseña: string) => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresaActual, setEmpresaActual] = useState<Empresa | null>(null)
  const [modulos, setModulos] = useState<Modulos[]>([])
  const [loading, setLoading] = useState(true)

  const api = axios.create({
    baseURL: buildApiUrl("/"),
    withCredentials: true,
  })
  

  const checkAuth = async () => {
    try {
      const response = await api.get("auth/me")
      setUsuario(response.data.usuario)
      setEmpresas(response.data.empresas)
      setModulos(response.data.modulos)
      if (response.data.empresas.length > 0) {
        setEmpresaActual(response.data.empresas[0])
      }
    } catch {
      setUsuario(null)
      setEmpresas([])
      setModulos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (email: string, contraseña: string) => {
    const response = await api.post("auth/login", { email, contraseña })
    setUsuario(response.data.usuario)
    await checkAuth()
  }

  const logout = async () => {
    await api.post("auth/logout")
    setUsuario(null)
    setEmpresas([])
    setEmpresaActual(null)
    setModulos([])
  }

  const validarModulo = (moduloNombre: string) => {
    return modulos.some((modulo) => modulo.nombre === moduloNombre)
  }

  const register = async (nombre: string, email: string, contraseña: string) => {
    await api.post("auth/registro", { nombre, email, contraseña })
  }

  return (
    <AuthContext.Provider
      value={{ usuario, empresas, modulos, empresaActual, validarModulo, setEmpresaActual, loading, login, logout, register, checkAuth }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider")
  }
  return context
}
