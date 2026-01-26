import React, { useEffect, useState } from 'react';
import { useAuth } from "../../../context/AuthContext";
import { buildApiUrl } from '../../../config/api';
import axios from 'axios';

// IMPORTAMOS EL MODAL DESDE SU NUEVA UBICACIÓN
import ModalSolicitudPago from '../../../components/solicitudes/Modales/ModalSolicitudPago';

const GestionPagos: React.FC = () => {
  const { empresaActual } = useAuth();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    if (empresaActual?.id) {
        obtenerSolicitudes();
    }
  }, [empresaActual?.id]);

  const obtenerSolicitudes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(buildApiUrl(`/pagos/solicitudes?empresa_id=${empresaActual?.id}`), {
        withCredentials: true
      });
      const data = Array.isArray(response.data) ? response.data : (response.data?.rows ?? []);
      setSolicitudes(data);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Error al obtener solicitudes';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearSolicitud = async (formData: FormData) => {
    try {
        setLoading(true);
        // La lógica de limpieza ya ocurrió dentro del Modal, aquí solo enviamos
        await axios.post(buildApiUrl('/pagos/solicitudes'), formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true
        });
        setIsModalOpen(false);
        obtenerSolicitudes(); 
    } catch (err: any) {
        const msg = err?.response?.data?.error || err.message || 'Error al guardar solicitud';
        setError(msg);
    } finally {
        setLoading(false);
    }
  };

  const formatoFecha = (fechaStr: string) => {
    if(!fechaStr) return '-';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-VE');
  }

  const getStatusStyle = (status: string) => {
    switch(status?.toLowerCase()) {
        case 'completado': return 'bg-green-100 text-green-700 border-green-200';
        case 'rechazado': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
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
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-red-700 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-red-800 shadow-lg shadow-red-100 transition-all flex items-center gap-2 active:scale-95"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Nueva Solicitud
        </button>
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
                <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-slate-700">Concepto</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-right border-r border-slate-700 bg-green-900/30">Monto USD</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-right border-r border-slate-700 text-yellow-300">Monto Bs</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-center border-r border-slate-700">Estatus</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-center">Soporte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {solicitudes.map((sol, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">
                    <div className="font-bold text-slate-700">{formatoFecha(sol.creado_en)}</div>
                    <div className="text-[10px] text-slate-400 font-mono">#{sol.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-700">{sol.beneficiario_nombre}</div>
                    <div className="text-[10px] text-slate-400 font-mono">RIF: {sol.beneficiario_rif}</div>
                  </td>
                  <td className="px-4 py-3 max-w-xs whitespace-normal">
                    <div className="text-slate-600">{sol.concepto}</div>
                    <div className="text-[10px] text-slate-400 italic">{sol.banco_origen ? `Banco: ${sol.banco_origen}` : ''}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-green-600 bg-green-50/30">
                    {Number(sol.monto_usd).toFixed(2)} $
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                     Bs {Number(sol.monto_bs).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(sol.estatus)}`}>
                        {sol.estatus || 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {sol.comprobante ? (
                        <a href={sol.comprobante} target="_blank" rel="noopener noreferrer" className="text-red-700 hover:underline font-bold text-[10px] uppercase">
                            Ver PDF/Img
                        </a>
                    ) : (
                        <span className="text-slate-300 text-[10px]">-</span>
                    )}
                  </td>
                </tr>
              ))}
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

      {/* Renderizado del Modal Importado */}
      <ModalSolicitudPago 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleCrearSolicitud}
        empresaId={empresaActual?.id}
      />
    </div>
  );
}

export default GestionPagos;