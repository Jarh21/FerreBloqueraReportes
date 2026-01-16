import React from 'react'
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import { buildApiUrl } from '../../../config/api';
interface Usuario {
  id: number
  nombre: string
  email: string
  role_id: string
  estado: string
  empresasAsignadas:[]
}

interface Empresa {
    id: number;
    nombre: string;
}

function UsuarioEditar() {

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);

   // 1. Define los estados locales para cada campo del formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [role_id, setRoleId] = useState('');
  const [estado, setEstado] = useState(''); // Añadido estado del usuario
  const [contraseña, setContraseña] = useState('');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [selectedEmpresas, setSelectedEmpresas] = useState<number[]>([]); // IDs de las empresas del usuario
  const [roles, setRoles] = useState<{id: number, nombre: string, descripcion: string}[]>([])
  // Definimos la función dentro del contexto donde se llama
  const fetchUsuario = async (userId: string) => { 
    try {
      const response = await axios.get(buildApiUrl(`/usuarios/${userId}`), {
        withCredentials: true,
      });
      setUsuario(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  //cargar todas las empresas
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
        }// Aquí harías una llamada a tu API para obtener todas las empresas disponibles
      
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

  useEffect(() => {
    if (id) {
      // Ahora fetchUsuario sí se encuentra
      fetchUsuario(id); 
      fetchEmpresas();
      fetchRoles();
    }
  }, [id]); // Dependencia del useEffect

  // 2. Sincroniza los datos del usuario cargado con los estados del formulario
  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre);
      setEmail(usuario.email);
      setRoleId(usuario.role_id);
      setEstado(usuario.estado);

      // Aquí, si tu objeto usuario incluyera un array de IDs de empresas asignadas,
      // lo inicializarías:      

       if (usuario.empresasAsignadas) {
        //console.log("Empresas asignadas del usuario:", usuario.empresasAsignadas);
           setSelectedEmpresas(usuario.empresasAsignadas as number[]); // Asegúrate de que este campo existe en tu API);
       }
       
    }
  }, [usuario]); // Este efecto se ejecuta solo cuando 'usuario' cambia de null a tener datos.


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica para enviar los datos actualizados a la API
    setLoading(true);
    const datosFormulario = {
      nombre,
      email,
      role_id,
      contraseña,
      estado,
      selectedEmpresas
    };
    try{
      await axios.put(buildApiUrl(`/usuarios/${id}`), datosFormulario, {
        withCredentials:true,
      });
      navigate('/dashboard/configuracion/usuarios');
    }catch(err){
      console.log("Error al actualizar el usuario:", err);
    }finally{
      setLoading(false);
    }
    
  };

  // 3. Manejador para Checkboxes
  const handleEmpresaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const empresaId = Number(e.target.value);
    if (e.target.checked) {
      // Si se marca, añade el ID a la lista de seleccionados
      setSelectedEmpresas([...selectedEmpresas, empresaId]);
    } else {
      // Si se desmarca, filtra el ID fuera de la lista
      setSelectedEmpresas(selectedEmpresas.filter(id => id !== empresaId));
    }
  };

  if (loading) {
    return <div>Cargando datos del usuario...</div>;
  }

  // 4. Asegúrate de usar los estados locales en los 'value' de los inputs
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-4xl overflow-hidden">
        {/* Encabezado con estilo diferenciado para Edición */}
        <div className="bg-white px-8 pt-8 pb-6 border-b border-slate-50">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-8 bg-primary-500 rounded-full"></span>
            Editar Usuario: <span className="text-primary-600 ml-1">{nombre}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Modifica los privilegios y accesos del usuario en el sistema.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Nombre Completo */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Nombre Completo</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
                placeholder="Ej. Juan Pérez"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
                placeholder="tu@email.com"
                required
              />
            </div>

            {/* Password (Opcional en edición) */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Nueva Contraseña</label>
              <input
                type="password"
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
                placeholder="Dejar vacío para no cambiar"
              />
              <p className="text-[11px] text-slate-400 ml-1 italic">* Solo si desea actualizarla</p>
            </div>

            {/* Estado (Badge-style Select) */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Estado de Cuenta</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 transition-all outline-none font-medium ${
                  estado === 'activo' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                <option value="activo">● Activo</option>
                <option value="inactivo">● Inactivo</option>
              </select>
            </div>

            {/* Roles */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Rol Asignado</label>
              <select
                value={role_id}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all outline-none"
              >
                {roles.map(role=> (
                    <option key={role.id} value={role.id} >{role.nombre}</option>
                ))}
              </select>
            </div>

            {/* Empresas (Layout de Tags/Chips) */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Empresas Asignadas</label>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 min-h-[100px]">
                <div className="flex flex-wrap gap-3">
                  {empresas.map((empresa) => (
                    <label 
                      key={empresa.id} 
                      className={`flex items-center px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-all ${
                        selectedEmpresas.includes(empresa.id)
                        ? 'bg-primary-100 border-primary-300 text-primary-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        value={empresa.id}
                        onChange={handleEmpresaChange}
                        checked={selectedEmpresas.includes(empresa.id)}
                        className="hidden" // Escondemos el checkbox real para usar el estilo de tag
                      />
                      <span className={`w-2 h-2 rounded-full mr-2 ${selectedEmpresas.includes(empresa.id) ? 'bg-primary-500' : 'bg-slate-300'}`}></span>
                      {empresa.nombre}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Acciones Inferiores */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="text-slate-500 hover:text-slate-700 font-medium transition"
            >
              Cancelar y Volver
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-10 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default UsuarioEditar;