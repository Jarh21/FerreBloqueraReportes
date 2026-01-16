"use client"

import type React from "react"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import axios from "axios"
import { buildApiUrl } from '../../../config/api';
interface Empresa {
  id: number
  nombre: string
  rif: string
  direccion?: string
  telefono?: string
  email?: string
  ciudad?: string
  servidor?: string
  puerto?: string
  usuario_db?: string
  clave?: string
  basedatos?: string
}

export default function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    rif: "",
    direccion: "",
    telefono: "",
    email: "",
    ciudad: "",
    servidor:"",
    puerto:"",
    usuario_db:"",
    clave:"",
    basedatos:""
  })

  useEffect(() => {
    fetchEmpresas()
  }, [])

  const navigate = useNavigate();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post(buildApiUrl("/empresas"), formData, {
        withCredentials: true,
      })
      setFormData({ nombre: "", rif: "", direccion: "", telefono: "", email: "", ciudad: "",servidor:"", puerto:"", usuario_db:"", clave:"", basedatos:"" })
      setMostrarForm(false)
      fetchEmpresas()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary-600">Gestión de Empresas</h1>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-neutral-800 hover:bg-neutral-600 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          {mostrarForm ? "Cancelar" : "Nueva Empresa"}
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <input
                type="text"
                placeholder="Rif"
                value={formData.rif}
                onChange={(e) => setFormData({ ...formData, rif: e.target.value })}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Dirección"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Ciudad"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Servidor siace"
                value={formData.servidor}
                onChange={(e) => setFormData({ ...formData, servidor: e.target.value })}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Puerto"
                value={formData.puerto}
                onChange={(e) => setFormData({ ...formData, puerto: e.target.value })}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Usuario DB"
                value={formData.usuario_db}
                onChange={(e) => setFormData({ ...formData, usuario_db: e.target.value })}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Clave"
                value={formData.clave}
                onChange={(e) => setFormData({ ...formData, clave: e.target.value })}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Base de Datos"
                value={formData.basedatos}
                onChange={(e) => setFormData({ ...formData, basedatos: e.target.value })}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="border border-neutral-200 my-4 rounded-lg">

            </div>
            <button
              type="submit"
              className="bg-accent-500 hover:bg-accent-600 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              Guardar Empresa
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-primary-500 text-white">
              <tr>
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-6 py-3 text-left">RIF</th>
                <th className="px-6 py-3 text-left">Ciudad</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Accion</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((empresa, index) => (
                <tr key={empresa.id} className={index % 2 === 0 ? "bg-primary-50" : "bg-white"}>
                  <td className="px-6 py-4 font-semibold text-neutral-900">{empresa.nombre}</td>
                  <td className="px-6 py-4">{empresa.rif || "-"}</td>
                  <td className="px-6 py-4">{empresa.ciudad || "-"}</td>
                  <td className="px-6 py-4">{empresa.email || "-"}</td>
                  <td className="px-6 py-4">
                    <div>        
                        
                      <button className="bg-primary-300 hover:bg-primary-600 text-white font-semibold py-1 px-3 rounded-lg transition" onClick={() => navigate(`/dashboard/configuracion/empresas/${empresa.id}`)}>Editar</button>
                      
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
