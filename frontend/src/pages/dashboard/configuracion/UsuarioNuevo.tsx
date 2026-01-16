"use client"
import type React from "react"
import { buildApiUrl } from '../../../config/api';
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

export default function UsuarioNuevo() {
    interface Empresa { id: number; nombre: string }
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [nombre, setNombre] = useState("")
    const [email, setEmail] = useState("")
    const [contraseña, setContraseña] = useState("")
    const [confirmar, setConfirmar] = useState("")
    const [role_id, setRoleId] = useState("2") // Default a rol Usuario si es adecuado
    const [selectedEmpresas, setSelectedEmpresas] = useState<number[]>([]) // ESTADO NUEVO para las IDs
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [roles, setRoles] = useState<{id: number, nombre: string, descripcion: string}[]>([])
    const navigate = useNavigate()
    // const { register, login } = useAuth() // No usaremos estas funciones si separamos la lógica aquí

    // buscar empresas para asignar al usuario
    useEffect(() => {
        fetchEmpresas()
        fetchRoles()
    }, [])

    const fetchEmpresas = async () => {
        try {
            const response = await axios.get(buildApiUrl("/empresas"), {
                withCredentials: true,
            })
            setEmpresas(response.data)
        } catch (error) {
            console.error("Error:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchRoles = async () => {
        try {
            const response = await axios.get(buildApiUrl("/usuarios/roles/list"), {
                withCredentials: true,
            })
            setRoles(response.data)
        } catch (error) {
            console.error("Error al obtener roles:", error)
        } 
    }

    // NUEVA FUNCIÓN: Maneja los cambios en los checkboxes
    const handleEmpresaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const empresaId = Number(event.target.value)
        if (event.target.checked) {
            setSelectedEmpresas(prev => [...prev, empresaId])
        } else {
            setSelectedEmpresas(prev => prev.filter(id => id !== empresaId))
        }
    }
    
    // Función de envío actualizada para incluir `selectedEmpresas`
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
    
        if (contraseña !== confirmar) {
          setError("Las contraseñas no coinciden")
          return
        }
    
        setLoading(true)

        // Preparamos los datos a enviar, incluyendo las empresas seleccionadas
        const userData = {
            nombre,
            email,
            contraseña,
            role_id: Number(role_id), // Asegurarse de que sea un número
            empresa_id: selectedEmpresas // Campo nuevo en el body
        }
    
        try {
          // Usamos axios directamente para hacer el POST al endpoint de Node.js
          await axios.post(buildApiUrl("/usuarios"), userData, {
             withCredentials: true, // Importante si usas cookies/sesiones
          })
          
          navigate("/dashboard/configuracion/usuarios") // Redirige tras éxito
          
        } catch (err: any) {
          setError(err.response?.data?.error || "Error al registrar")
        } finally {
          setLoading(false)
        }
    }
    
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-neutral-800 mb-2">Registro de Usuario</h1>
          <p className="text-neutral-500">Completa los datos para crear una nueva cuenta</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex items-center">
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grid Principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            
            {/* Nombre */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700">Nombre Completo</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                placeholder="Juan Pérez"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                placeholder="tu@email.com"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700">Contraseña</label>
              <input
                type="password"
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Confirmar Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700">Confirmar Contraseña</label>
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Roles (Select) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700">Rol de Usuario</label>
              <select
                value={role_id}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white cursor-pointer"
              >
                {
                  roles.map(role => (
                    <option key={role.id} value={role.id}>{role.nombre}</option>
                  ))
                }                
              </select>
            </div>

            {/* Empresas (Checkboxes mejorados) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700">Empresas Asignadas</label>
              <div className="p-3 border border-neutral-200 rounded-lg bg-neutral-50 max-h-[120px] overflow-y-auto space-y-2">
                {empresas.map((empresa) => (
                  <label key={empresa.id} className="flex items-center space-x-3 cursor-pointer hover:bg-white p-1 rounded transition">
                    <input
                      type="checkbox"
                      value={empresa.id}
                      onChange={handleEmpresaChange}
                      checked={selectedEmpresas.includes(empresa.id)}
                      className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-600">{empresa.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Botón de acción */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-max md:px-12 ml-auto block bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary-200 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
    
  )
}