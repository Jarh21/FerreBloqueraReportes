import React, { useEffect, useState } from 'react';
import { useAuth } from "../../../context/AuthContext";
import { buildApiUrl } from '../../../config/api';
import axios from 'axios';

// IMPORTAMOS LOS MODALES
import ModalSolicitudPago from '../../../components/solicitudes/Modales/ModalSolicitudPago';
import ModalProcesarPago from '../../../components/solicitudes/Modales/ModalProcesarPago';
import ModalDetalleSolicitud from '../../../components/solicitudes/Modales/ModalDetalleSolicitud'; // <--- NUEVO IMPORT

const GestionPagos: React.FC = () => {
  const { empresaActual, validarModulo } = useAuth();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  
  // Estado para Modal CREAR
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado para Modal PROCESAR
  const [isProcesarModalOpen, setIsProcesarModalOpen] = useState(false);
  
  // Estado para Modal DETALLES (NUEVO)
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  
  // Solicitud seleccionada (se usa para Procesar y para Ver Detalles)
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any>(null);
  
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
      const endpoint = `/solicitudes/listar/${empresaActual.id}`;
      const response = await axios.get(buildApiUrl(endpoint), {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = Array.isArray(response.data) ? response.data : (response.data?.rows ?? []);
      setSolicitudes(data);
    } catch (err: any) {
      console.error("Error fetching solicitudes:", err);
      const msg = err?.response?.data?.error || err.message || 'Error al obtener solicitudes';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearSolicitud = async (formData: FormData) => {
    try {
        setLoading(true);
        // Si la modal hace el fetch, solo recargamos:
        obtenerSolicitudes(); 
        setIsModalOpen(false);
    } catch (err: any) {
        const msg = err?.response?.data?.error || err.message || 'Error al guardar solicitud';
        setError(msg);
    } finally {
        setLoading(false);
    }
  };

  const handleProcesarPago = async (idSolicitud: number, datosPago: any) => {
      try {
          setLoading(true);
          const formData = new FormData();
          formData.append('id_solicitud', idSolicitud.toString());
          formData.append('banco_origen', datosPago.banco_origen);
          formData.append('referencia', datosPago.referencia);
          formData.append('monto_pagado', datosPago.monto_pagado); 
          formData.append('es_abono', datosPago.es_abono ? 'true' : 'false');

          if (datosPago.comprobante) {
              formData.append('comprobante', datosPago.comprobante);
          }

          await axios.post(buildApiUrl('/solicitudes/procesar'), formData, {
              headers: { 
                  'Content-Type': 'multipart/form-data',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              withCredentials: true
          });

          alert(datosPago.es_abono ? "Abono registrado correctamente" : "Pago completado correctamente");
          setIsProcesarModalOpen(false);
          obtenerSolicitudes(); 

      } catch (err: any) {
          console.error(err);
          alert("Error al procesar el pago: " + (err.response?.data?.message || err.message));
      } finally {
          setLoading(false);
      }
  };

  // --- NUEVA LÓGICA: ANULAR SOLICITUD ---
  const handleAnularSolicitud = async (id: number) => {
      // 1. Confirmación
      const confirmacion = window.confirm("¿Estás seguro de que deseas ANULAR esta solicitud? Esta acción no se puede deshacer.");
      
      if (!confirmacion) return;

      try {
          setLoading(true);
          // Nota: Asegúrate de crear esta ruta en el backend luego.
          await axios.post(buildApiUrl(`/solicitudes/anular/${id}`), {}, {
              withCredentials: true,
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          
          alert("Solicitud anulada correctamente.");
          obtenerSolicitudes();

      } catch (err: any) {
          console.error(err);
          alert("Error al anular: " + (err.response?.data?.message || err.message));
      } finally {
          setLoading(false);
      }
  };

  // Abrir modal de procesar (Para pendientes)
  const abrirProcesar = (solicitud: any) => {
      setSolicitudSeleccionada(solicitud);
      setIsProcesarModalOpen(true);
  };

  // Abrir modal de detalles (Para pagados/abonados)
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
      // 0 = Pendiente, 1 = Pagado, 2 = Anulado, 3 = Abonado
      switch(status) {
          case 1: return <span className="px-2 py-1 rounded-full text-[10px] font-bold border bg-green-100 text-green-700 border-green-200">Pagado</span>;
          case 2: return <span className="px-2 py-1 rounded-full text-[10px] font-bold border bg-red-100 text-red-700 border-red-200">Anulado</span>;
          case 3: return <span className="px-2 py-1 rounded-full text-[10px] font-bold border bg-blue-100 text-blue-700 border-blue-200">Abonado</span>;
          default: return <span className="px-2 py-1 rounded-full text-[10px] font-bold border bg-yellow-100 text-yellow-700 border-yellow-200">Pendiente</span>;
      }
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-slate-200">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Gestión de <span className="text-red-700">Pagos</span>
          </h2>
          <p className="text-slate-500 text-sm">Control de solicitudes y transferencias a proveedores</p>
        </div>
        {validarModulo('Solicitudes.Crear_solicitud') ? (
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-red-700 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-red-800 shadow-lg shadow-red-100 transition-all flex items-center gap-2 active:scale-95"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                Nueva Solicitud
            </button>
        ) : null}
      </div>

      {/* Loading & Error */}
      {loading && (
        <div className="flex items-center justify-center py-10 gap-3 text-slate-500">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-700"></div>
          <span className="font-medium">Procesando...</span>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-700 text-red-800 rounded-r-lg mb-6 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          <span className="font-semibold text-sm">{error}</span>
        </div>
      )}

      {/* Tabla */}
      {solicitudes.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-800 text-slate-200">
              <tr>
                <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-slate-700">Fecha / ID</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-slate-700">Beneficiario</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-slate-700">Método Destino</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-slate-700">Concepto</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-right border-r border-slate-700 bg-green-900/30">Monto</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-center border-r border-slate-700">Estatus</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {solicitudes.map((sol, index) => {
                  // Estados: 0=Pendiente, 1=Pagado, 2=Anulado, 3=Abonado
                  const esPendiente = sol.estado_pago === 0 || sol.estado_pago === 3; 
                  const esAnulado = sol.estado_pago === 2;
                  
                  return (
                    <tr key={index} className={`hover:bg-slate-50 transition-colors group ${esAnulado ? 'opacity-50 grayscale bg-slate-50' : ''}`}>
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
                        <div className="font-bold text-green-700 text-sm">
                            {Number(sol.monto).toFixed(2)} {sol.moneda_pago === 'VES' ? 'Bs' : '$'}
                        </div>
                        {sol.total_pagado > 0 && sol.total_pagado < sol.monto && (
                             <div className="text-[9px] text-blue-600 font-bold">Abonado: {Number(sol.total_pagado).toFixed(2)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(sol.estado_pago)}
                      </td>

                      {/* COLUMNA DE ACCIONES */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                            
                            {/* BOTONES PARA PENDIENTE O ABONADO */}
                            {!esAnulado && esPendiente && (
                                <>
                                    <button 
                                        onClick={() => abrirProcesar(sol)}
                                        className="bg-green-100 text-green-700 p-1.5 rounded-md hover:bg-green-200 border border-green-200 transition-colors"
                                        title={sol.estado_pago === 3 ? "Agregar Abono / Completar" : "Procesar Pago"}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </button>
                                    
                                    {/* Botón ANULAR: Solo si no tiene abonos (Opcional, depende de tu regla de negocio) */}
                                    {sol.estado_pago === 0 && (
                                        <button 
                                            onClick={() => handleAnularSolicitud(sol.id)}
                                            className="bg-red-50 text-red-600 p-1.5 rounded-md hover:bg-red-100 border border-red-100 transition-colors"
                                            title="Anular Solicitud"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}
                                </>
                            )}

                            {/* BOTÓN "VER DETALLES" (Para Pagados o Abonados) */}
                            {!esAnulado && (sol.estado_pago === 1 || sol.estado_pago === 3) && (
                                <button 
                                    onClick={() => abrirDetalles(sol)}
                                    className="bg-blue-50 text-blue-600 p-1.5 rounded-md hover:bg-blue-100 border border-blue-100 transition-colors flex items-center gap-1 px-2"
                                    title="Ver Detalles y Comprobante"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    <span className="text-[10px] font-bold">Detalles</span>
                                </button>
                            )}

                             {/* Si está anulado, solo mostramos texto */}
                             {esAnulado && <span className="text-[10px] text-slate-400 font-mono">Anulado</span>}

                        </div>
                      </td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && (
            <div className="py-20 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <div className="text-slate-300 mb-3">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <p className="text-slate-500 font-medium">No hay solicitudes de pago registradas</p>
                <button onClick={() => setIsModalOpen(true)} className="text-red-700 text-sm font-bold hover:underline mt-2">Crear la primera solicitud</button>
            </div>
        )
      )}

      {/* MODAL CREAR */}
      <ModalSolicitudPago 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleCrearSolicitud}
        empresaId={empresaActual?.id}
      />

      {/* MODAL PROCESAR (PAGAR/ABONAR) */}
      <ModalProcesarPago 
        isOpen={isProcesarModalOpen}
        onClose={() => setIsProcesarModalOpen(false)}
        onProcesar={handleProcesarPago}
        solicitud={solicitudSeleccionada}
      />

      {/* MODAL DETALLES (SOLO LECTURA) */}
      <ModalDetalleSolicitud
        isOpen={isDetalleOpen}
        onClose={() => setIsDetalleOpen(false)}
        solicitud={solicitudSeleccionada}
      />

    </div>
  );
}

export default GestionPagos;