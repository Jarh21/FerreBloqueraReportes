import React, { useEffect, useState } from 'react';
import { useAuth } from "../../../context/AuthContext";
import { buildApiUrl, SERVER_URL } from '../../../config/api'; 
import axios from 'axios';
import { toast } from 'sonner'; 
import io from 'socket.io-client'; 

// IMPORTAMOS LOS MODALES
import ModalSolicitudPago from '../../../components/solicitudes/Modales/ModalSolicitudPago';
import ModalProcesarPago from '../../../components/solicitudes/Modales/ModalProcesarPago';
import ModalDetalleSolicitud from '../../../components/solicitudes/Modales/ModalDetalleSolicitud';

const GestionPagos: React.FC = () => {
  const { empresaActual, validarModulo } = useAuth();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  
  // Estados de Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcesarModalOpen, setIsProcesarModalOpen] = useState(false);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any>(null);
  
  // 1. CARGA INICIAL
  useEffect(() => {
    if (empresaActual?.id) {
        obtenerSolicitudes(false); // False = Muestra loading spinner
    }
  }, [empresaActual?.id]);

  // 2. SOCKET.IO (REFRESCO SILENCIOSO)
  useEffect(() => {
      const socket = io(SERVER_URL, { withCredentials: true, autoConnect: true });

      // Evento: Nueva Solicitud
      socket.on('nueva_solicitud', () => {
          obtenerSolicitudes(true); // True = Silencioso (sin spinner)
          toast.info("Nueva solicitud recibida", { position: 'bottom-right' });
      });

      // Evento: Solicitud Anulada (Por si otro admin anula algo mientras ves)
      socket.on('solicitud_anulada', (data: any) => {
          obtenerSolicitudes(true);
          if (solicitudSeleccionada?.id == data.id) {
              setIsProcesarModalOpen(false); // Cierra modales si estabas viendo esa solicitud
          }
      });

      return () => { socket.disconnect(); };
  }, [empresaActual?.id, solicitudSeleccionada]);

  // 3. FUNCIÓN DE CARGA (MEJORADA)
  // Agregamos el parametro 'isBackground' para controlar el spinner
  const obtenerSolicitudes = async (isBackground = false) => {
    if (!empresaActual?.id) return;

    try {
      // Solo mostramos el spinner si NO es una carga en segundo plano
      if (!isBackground) setLoading(true);
      setError(null);

      const endpoint = `/solicitudes/listar/${empresaActual.id}`;
      const response = await axios.get(buildApiUrl(endpoint), {
        withCredentials: true,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      let data = Array.isArray(response.data) ? response.data : (response.data?.rows ?? []);
      
      // Filtros: Pendientes (0) y Abonados (3)
      data = data.filter((s: any) => s.estado_pago === 0 || s.estado_pago === 3);

      // Ordenamiento: Agrupado por estado, luego por fecha
      data.sort((a: any, b: any) => {
          if (a.estado_pago === b.estado_pago) {
              return new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime();
          }
          return a.estado_pago - b.estado_pago; 
      });

      setSolicitudes(data);

    } catch (err: any) {
      console.error("Error fetching solicitudes:", err);
      if (!isBackground) setError('Error al obtener solicitudes');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleCrearSolicitud = async () => {
    // Al guardar, forzamos refresco manual por seguridad
    await obtenerSolicitudes(true); 
    setIsModalOpen(false);
  };

  const handleProcesarPago = async (idSolicitud: number, datosPago: any) => {
      try {
          // Aquí sí mostramos loading porque es una acción del usuario
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

          toast.success(datosPago.es_abono ? "Abono registrado" : "Pago completado");
          setIsProcesarModalOpen(false);
          obtenerSolicitudes(true); 

      } catch (err: any) {
          console.error(err);
          toast.error("Error al procesar", { description: err.response?.data?.message || err.message });
      } finally {
          setLoading(false);
      }
  };

  // Anular Solicitud (Con Toast Promise)
  const handleAnularSolicitud = async (id: number) => {
      const confirmacion = window.confirm("¿Estás seguro de ANULAR esta solicitud? Desaparecerá de esta lista.");
      if (!confirmacion) return;

      toast.promise(
          axios.post(buildApiUrl(`/solicitudes/anular/${id}`), {}, {
              withCredentials: true,
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }),
          {
              loading: 'Anulando...',
              success: () => {
                  obtenerSolicitudes(true);
                  return 'Solicitud anulada correctamente';
              },
              error: (err) => err.response?.data?.message || 'Error al anular'
          }
      );
  };

  const abrirProcesar = (solicitud: any) => {
      setSolicitudSeleccionada(solicitud);
      setIsProcesarModalOpen(true);
  };

  const abrirDetalles = (solicitud: any) => {
      setSolicitudSeleccionada(solicitud);
      setIsDetalleOpen(true);
  };

  const formatoFecha = (fechaStr: string) => {
    if(!fechaStr) return '-';
    return new Date(fechaStr).toLocaleDateString('es-VE');
  }

  const getStatusBadge = (status: number) => {
      switch(status) {
          case 3: return <span className="px-2 py-1 rounded-full text-[10px] font-bold border bg-blue-100 text-blue-700 border-blue-200">Abonado (Parcial)</span>;
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
          <p className="text-slate-500 text-sm">Bandeja de solicitudes pendientes por procesar</p>
        </div>
        {validarModulo('Solicitudes.Crear_solicitud') && (
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-red-700 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-red-800 shadow-lg shadow-red-100 transition-all flex items-center gap-2 active:scale-95"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                Nueva Solicitud
            </button>
        )}
      </div>

      {/* Loading (Solo aparece en carga inicial manual) */}
      {loading && (
        <div className="flex items-center justify-center py-10 gap-3 text-slate-500">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-700"></div>
          <span className="font-medium">Procesando...</span>
        </div>
      )}
      
      {error && !loading && (
        <div className="p-4 bg-red-50 border-l-4 border-red-700 text-red-800 rounded-r-lg mb-6 flex items-center gap-2">
          <span className="font-semibold text-sm">{error}</span>
        </div>
      )}

      {/* Tabla */}
      {!loading && solicitudes.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm animate-fade-in-down">
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
                  const esPrimerAbonado = sol.estado_pago === 3 && (index === 0 || solicitudes[index - 1].estado_pago !== 3);
                  return (
                    <React.Fragment key={sol.id || index}>
                        {esPrimerAbonado && (
                             <tr className="bg-blue-50">
                                <td colSpan={7} className="px-4 py-2 text-blue-800 font-bold text-[10px] uppercase tracking-wider border-y border-blue-100 text-center">
                                    ▼ Solicitudes con Abonos Parciales ▼
                                </td>
                             </tr>
                        )}
                        <tr className="hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">
                          <div className="text-[10px] text-green-700 font-mono">Solicita: <br />{sol.solicitante}</div>
                            <div className="font-bold text-slate-700">{formatoFecha(sol.creado_en)}</div>
                            <div className="text-[11px] text-slate-400 font-mono">#{sol.id}</div>
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
                            {Number(sol.total_pagado) > 0 && (
                                <div className="text-[9px] text-blue-600 font-bold">Abonado: {Number(sol.total_pagado).toFixed(2)}</div>
                            )}
                        </td>
                        <td className="px-4 py-3 text-center">
                            {getStatusBadge(sol.estado_pago)}
                        </td>

                        <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                                <button 
                                    onClick={() => abrirProcesar(sol)}
                                    className="bg-green-100 text-green-700 p-1.5 rounded-md hover:bg-green-200 border border-green-200 transition-colors"
                                    title={sol.estado_pago === 3 ? "Agregar Abono" : "Procesar Pago"}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </button>
                                
                                <button 
                                    onClick={() => abrirDetalles(sol)}
                                    className="bg-blue-50 text-blue-600 p-1.5 rounded-md hover:bg-blue-100 border border-blue-100 transition-colors"
                                    title="Ver Detalles"
                                >
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>

                                {sol.estado_pago === 0 && (
                                    <button 
                                        onClick={() => handleAnularSolicitud(sol.id)}
                                        className="bg-red-50 text-red-600 p-1.5 rounded-md hover:bg-red-100 border border-red-100 transition-colors"
                                        title="Anular Solicitud"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                )}
                            </div>
                        </td>
                        </tr>
                    </React.Fragment>
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
                <p className="text-slate-500 font-medium">No hay solicitudes pendientes</p>
                <p className="text-slate-400 text-xs mt-1">Todas las solicitudes han sido procesadas o anuladas.</p>
                <button onClick={() => setIsModalOpen(true)} className="text-red-700 text-sm font-bold hover:underline mt-2">Crear nueva solicitud</button>
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