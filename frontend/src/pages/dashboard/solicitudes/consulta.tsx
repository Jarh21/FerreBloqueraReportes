import React, { useEffect, useState } from 'react';
import { useAuth } from "../../../context/AuthContext";
import { buildApiUrl } from '../../../config/api';
import axios from 'axios';

// IMPORTAMOS SOLO LA MODAL DE LECTURA
import ModalDetalleSolicitud from '../../../components/solicitudes/Modales/ModalDetalleSolicitud';

const ConsultaPagos: React.FC = () => {
  const { empresaActual } = useAuth();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [solicitudes, setSolicitudes] = useState<any[]>([]); // Data original
  const [solicitudesFiltradas, setSolicitudesFiltradas] = useState<any[]>([]); // Data para mostrar

  // Estado para Modal DETALLES
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any>(null);

  // --- ESTADO DE LOS FILTROS ---
  const [filtros, setFiltros] = useState({
      fechaInicio: '',
      fechaFin: '',
      beneficiario: '',
      cuentaContable: '',
      empresa: '',
      usuario: '',
      bancoOrigen: ''
  });
  
  useEffect(() => {
    if (empresaActual?.id) {
        obtenerSolicitudes();
    }
  }, [empresaActual?.id]);

  const obtenerSolicitudes = async () => {
    if (!empresaActual?.id) return;

    try {
      setLoading(true);
      setError(null);
      // Aquí podrías cambiar el endpoint si tienes uno específico de búsqueda avanzada
      const endpoint = `/solicitudes/listar/${empresaActual.id}`; 
      const response = await axios.get(buildApiUrl(endpoint), {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = Array.isArray(response.data) ? response.data : (response.data?.rows ?? []);
      setSolicitudes(data);
      setSolicitudesFiltradas(data); // Inicialmente mostramos todo
    } catch (err: any) {
      console.error("Error fetching solicitudes:", err);
      const msg = err?.response?.data?.error || err.message || 'Error al obtener solicitudes';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- MANEJO DE FILTROS (VISUAL POR AHORA) ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFiltros({
          ...filtros,
          [e.target.name]: e.target.value
      });
  };

  const handleBuscar = () => {
      // Aquí implementas la lógica de filtrado (Local o Backend)
      // Ejemplo de filtrado local simple:
      let filtrado = [...solicitudes];

      if(filtros.beneficiario) {
          filtrado = filtrado.filter(s => s.beneficiario_nombre.toLowerCase().includes(filtros.beneficiario.toLowerCase()));
      }
      if(filtros.fechaInicio) {
          filtrado = filtrado.filter(s => new Date(s.creado_en) >= new Date(filtros.fechaInicio));
      }
      // ... agregar resto de lógica de filtros aquí
      
      setSolicitudesFiltradas(filtrado);
  };

  const handleLimpiarFiltros = () => {
      setFiltros({
          fechaInicio: '',
          fechaFin: '',
          beneficiario: '',
          cuentaContable: '',
          empresa: '',
          usuario: '',
          bancoOrigen: ''
      });
      setSolicitudesFiltradas(solicitudes);
  };

  // --- EXPORTAR A CSV ---
  const handleExportarCSV = () => {
      if (solicitudesFiltradas.length === 0) return;

      const headers = ["ID", "Fecha", "Beneficiario", "RIF", "Concepto", "Monto", "Moneda", "Estatus", "Banco Origen", "Referencia"];
      
      const rows = solicitudesFiltradas.map(sol => [
          sol.id,
          new Date(sol.creado_en).toLocaleDateString(),
          sol.beneficiario_nombre,
          sol.beneficiario_rif,
          `"${sol.concepto}"`, // Escapar comillas
          sol.monto,
          sol.moneda_pago,
          sol.estado_pago === 1 ? 'Pagado' : (sol.estado_pago === 3 ? 'Abonado' : 'Pendiente'),
          sol.banco_origen || '-',
          sol.referencia_pago || '-'
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
          + headers.join(",") + "\n" 
          + rows.map(e => e.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `reporte_pagos_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const abrirDetalles = (solicitud: any) => {
      setSolicitudSeleccionada(solicitud);
      setIsDetalleOpen(true);
  };

  const formatoFecha = (fechaStr: string) => {
    if(!fechaStr) return '-';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-VE');
  }

  const getStatusBadge = (status: number) => {
      switch(status) {
          case 1: return <span className="px-2 py-1 rounded-full text-[10px] font-bold border bg-green-100 text-green-700 border-green-200">Pagado</span>;
          case 2: return <span className="px-2 py-1 rounded-full text-[10px] font-bold border bg-red-100 text-red-700 border-red-200">Anulado</span>;
          case 3: return <span className="px-2 py-1 rounded-full text-[10px] font-bold border bg-blue-100 text-blue-700 border-blue-200">Abonado</span>;
          default: return <span className="px-2 py-1 rounded-full text-[10px] font-bold border bg-yellow-100 text-yellow-700 border-yellow-200">Pendiente</span>;
      }
  }

  // Estilos comunes para inputs de filtro
  const inputFilterClass = "w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:ring-2 focus:ring-slate-400 outline-none transition-all";
  const labelFilterClass = "text-[10px] font-bold text-slate-500 uppercase mb-1 block";

  return (
    <div className="flex flex-col gap-6">
      
      {/* ---------------- SECCIÓN DE FILTROS ---------------- */}
      <div className="p-6 bg-white rounded-xl shadow-lg border border-slate-200">
        <h3 className="text-lg font-black text-slate-800 mb-4 border-b border-slate-100 pb-2">Filtros de Búsqueda</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Fila 1 */}
            <div>
                <label className={labelFilterClass}>Fecha Inicio</label>
                <input type="date" name="fechaInicio" value={filtros.fechaInicio} onChange={handleInputChange} className={inputFilterClass} />
            </div>
            <div>
                <label className={labelFilterClass}>Fecha Fin</label>
                <input type="date" name="fechaFin" value={filtros.fechaFin} onChange={handleInputChange} className={inputFilterClass} />
            </div>
            <div>
                <label className={labelFilterClass}>Beneficiario</label>
                <input type="text" name="beneficiario" placeholder="Buscar beneficiario..." value={filtros.beneficiario} onChange={handleInputChange} className={inputFilterClass} />
            </div>

            {/* Fila 2 */}
            <div>
                <label className={labelFilterClass}>Cuenta Contable</label>
                <select name="cuentaContable" value={filtros.cuentaContable} onChange={handleInputChange} className={inputFilterClass}>
                    <option value="">Todas las cuentas</option>
                    {/* Aquí mapearías tus cuentas contables */}
                </select>
            </div>
            <div>
                <label className={labelFilterClass}>Empresa</label>
                <select name="empresa" value={filtros.empresa} onChange={handleInputChange} className={inputFilterClass}>
                    <option value="">Seleccionar empresa</option>
                    {/* Aquí mapearías tus empresas */}
                </select>
            </div>
            <div>
                <label className={labelFilterClass}>Usuario</label>
                <select name="usuario" value={filtros.usuario} onChange={handleInputChange} className={inputFilterClass}>
                    <option value="">Seleccionar usuario</option>
                    {/* Aquí mapearías tus usuarios */}
                </select>
            </div>

             {/* Fila 3 */}
             <div>
                <label className={labelFilterClass}>Banco de Origen</label>
                <select name="bancoOrigen" value={filtros.bancoOrigen} onChange={handleInputChange} className={inputFilterClass}>
                    <option value="">Seleccionar banco</option>
                    {/* Aquí mapearías tus bancos */}
                </select>
            </div>
        </div>

        {/* Botones de Acción Filtros */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
            <div className="flex gap-2">
                <button onClick={handleBuscar} className="bg-slate-900 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-black transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    Buscar
                </button>
                <button onClick={handleLimpiarFiltros} className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">
                    Limpiar Filtros
                </button>
            </div>

            <button onClick={handleExportarCSV} className="bg-white text-green-700 border border-green-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-50 transition-colors flex items-center gap-2 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Exportar CSV
            </button>
        </div>
      </div>

      {/* ---------------- SECCIÓN DE TABLA ---------------- */}
      <div className="p-6 bg-white rounded-xl shadow-lg border border-slate-200">
        
        {/* Loading & Error */}
        {loading && (
            <div className="flex items-center justify-center py-10 gap-3 text-slate-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-700"></div>
            <span className="font-medium">Cargando datos...</span>
            </div>
        )}
        
        {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-700 text-red-800 rounded-r-lg mb-6 flex items-center gap-2">
            <span className="font-semibold text-sm">{error}</span>
            </div>
        )}

        {/* Tabla */}
        {!loading && !error && (
            solicitudesFiltradas.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                <table className="min-w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <tr>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider">Fecha / ID</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider">Beneficiario</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider">Método Destino</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider">Concepto</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-right">Monto</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-center">Estatus</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-center">Acciones</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                    {solicitudesFiltradas.map((sol, index) => {
                        const esAnulado = sol.estado_pago === 2;
                        
                        return (
                            <tr key={index} className={`hover:bg-slate-50 transition-colors ${esAnulado ? 'opacity-50 bg-slate-50' : ''}`}>
                            <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">
                                <div className="font-bold text-slate-700">{formatoFecha(sol.creado_en)}</div>
                                <div className="text-[10px] text-slate-400 font-mono">#{sol.id}</div>
                            </td>
                            <td className="px-4 py-3">
                                <div className="font-bold text-slate-700">{sol.beneficiario_nombre}</div>
                                <div className="text-[10px] text-slate-400 font-mono">RIF: {sol.beneficiario_rif}</div>
                            </td>
                            <td className="px-4 py-3">
                                <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200 mb-1">
                                    {sol.tipo_pago}
                                </span>
                                <div className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]" title={sol.beneficiario_identificador}>
                                    {sol.beneficiario_banco ? `${sol.beneficiario_banco} - ` : ''}
                                    {sol.beneficiario_identificador}
                                </div>
                            </td>
                            <td className="px-4 py-3 max-w-xs whitespace-normal">
                                <div className="text-slate-600 italic">"{sol.concepto}"</div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                                <div className="font-bold text-slate-700 text-sm">
                                    {Number(sol.monto).toFixed(2)} {sol.moneda_pago === 'VES' ? 'Bs' : '$'}
                                </div>
                                {sol.total_pagado > 0 && sol.total_pagado < sol.monto && (
                                    <div className="text-[9px] text-blue-600 font-bold">Abonado: {Number(sol.total_pagado).toFixed(2)}</div>
                                )}
                            </td>
                            <td className="px-4 py-3 text-center">
                                {getStatusBadge(sol.estado_pago)}
                            </td>

                            {/* COLUMNA DE ACCIONES: SOLO DETALLES */}
                            <td className="px-4 py-3 text-center">
                                <button 
                                    onClick={() => abrirDetalles(sol)}
                                    className="bg-blue-600 text-white p-1.5 rounded-md hover:bg-blue-700 shadow-sm transition-all text-xs font-bold px-3"
                                    title="Ver Detalles y Comprobante"
                                >
                                    Detalles
                                </button>
                            </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
                </div>
            ) : (
                <div className="py-20 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <div className="text-slate-300 mb-3">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <p className="text-slate-500 font-medium">No se encontraron registros con los filtros actuales</p>
                </div>
            )
        )}
      </div>

      {/* MODAL DETALLES (SOLO LECTURA) */}
      <ModalDetalleSolicitud
        isOpen={isDetalleOpen}
        onClose={() => setIsDetalleOpen(false)}
        solicitud={solicitudSeleccionada}
      />

    </div>
  );
}

export default ConsultaPagos;