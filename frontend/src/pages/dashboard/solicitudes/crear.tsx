import React, { useEffect, useState } from 'react';
import { useAuth } from "../../../context/AuthContext";
import { buildApiUrl } from '../../../config/api';
import SelectorBancos from '../../../components/solicitudes/SelectSolicitudes/SelectorBancos';
// Asegúrate de que esta ruta sea la correcta hacia tu componente Selector
import SelectorTiposPago from '../../../components/solicitudes/SelectSolicitudes/SelectorTipoPago';
import axios from 'axios';

// ==========================================
// 1. CONSTANTES GLOBALES (Configuración)
// ==========================================
const TIPOS_PAGO = {
  BINANCE: "BINANCE",
  TRANSFERENCIA: "TRANSFERENCIA",
  PAGO_MOVIL: "PAGO MOVIL",
  ZELLE: "ZELLE"
};

// Generamos el array para el filtro del Selector automáticamente
const LISTA_OPCIONES_PERMITIDAS = Object.values(TIPOS_PAGO);


// ==========================================
// 2. SUBCOMPONENTE: MODAL DE CREACIÓN
// ==========================================
const ModalSolicitudPago = ({ isOpen, onClose, onSave, empresaId }: any) => {
  const [formData, setFormData] = useState({
    solicitante: '',
    tipo_pago: '',
    concepto: '',
    cuenta_contable_id: '',
    // Datos Beneficiario
    beneficiario_nombre: '',
    beneficiario_rif: '',
    beneficiario_banco: '',
    beneficiario_telefono: '',
    beneficiario_cuenta: '',
    beneficiario_email: '', // Nuevo campo necesario para Zelle/Binance
    // Datos Pago
    monto_usd: 0,
    tasa: 0,
    monto_bs: 0,
    // Datos Procesamiento
    referencia: '',
    banco_origen: '',
    comprobante: null as File | null
  });

  // Cálculo automático de Bs
  useEffect(() => {
    const bs = (parseFloat(formData.monto_usd as any) || 0) * (parseFloat(formData.tasa as any) || 0);
    setFormData(prev => ({ ...prev, monto_bs: parseFloat(bs.toFixed(2)) }));
  }, [formData.monto_usd, formData.tasa]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, comprobante: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = new FormData();
    Object.keys(formData).forEach(key => {
        // @ts-ignore
        payload.append(key, formData[key]);
    });
    if(empresaId) payload.append('empresa_id', empresaId);

    onSave(payload);
  };

  if (!isOpen) return null;

  // Estilos reutilizables
  const inputClass = "w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all";
  const labelClass = "text-[10px] font-bold text-slate-400 uppercase ml-1";

  // --- LÓGICA DINÁMICA DE CAMPOS ---
  const renderCamposDinamicos = () => {
    switch (formData.tipo_pago) {
        
      case TIPOS_PAGO.ZELLE:
        return (
          <>
            <div className="space-y-1 md:col-span-2">
                <label className={labelClass}>Correo Zelle</label>
                <input name="beneficiario_email" value={formData.beneficiario_email} onChange={handleChange} className={inputClass} placeholder="ejemplo@correo.com" />
            </div>
            <div className="space-y-1">
                <label className={labelClass}>Titular de la cuenta</label>
                <input name="beneficiario_nombre" value={formData.beneficiario_nombre} onChange={handleChange} className={inputClass} />
            </div>
          </>
        );

      case TIPOS_PAGO.BINANCE:
        return (
          <>
            <div className="space-y-1 md:col-span-2">
                <label className={labelClass}>Binance ID / Email</label>
                <input name="beneficiario_email" value={formData.beneficiario_email} onChange={handleChange} className={inputClass} placeholder="ID o Correo" />
            </div>
             <div className="space-y-1">
                <label className={labelClass}>Nombre Usuario</label>
                <input name="beneficiario_nombre" value={formData.beneficiario_nombre} onChange={handleChange} className={inputClass} />
            </div>
          </>
        );

      case TIPOS_PAGO.PAGO_MOVIL:
  return (
    <>
      <div className="space-y-1">
          <label className={labelClass}>Banco Destino</label>
          {/* REEMPLAZO AQUÍ: */}
          <SelectorBancos
              name="beneficiario_banco"
              value={formData.beneficiario_banco}
              onChange={handleChange}
              className={inputClass}
              // Si tu API usa "name" en vez de "nombre", cámbialo aquí:
              labelKey="nombre" 
              valueKey="nombre"
          />
      </div>
      {/* ... resto de campos (Cédula, Teléfono) ... */}
    </>
  );

case TIPOS_PAGO.TRANSFERENCIA:
  return (
    <>
       {/* ... campo Beneficiario ... */}
       {/* ... campo RIF ... */}
      
      <div className="space-y-1">
          <label className={labelClass}>Banco Destino</label>
          {/* REEMPLAZO AQUÍ: */}
          <SelectorBancos
              name="beneficiario_banco"
              value={formData.beneficiario_banco}
              onChange={handleChange}
              className={inputClass}
          />
      </div>
      {/* ... campo Cuenta ... */}
    </>
  );

      default:
        return (
            <div className="md:col-span-3 py-6 text-center text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <p className="text-xs font-medium">⬆ Seleccione un tipo de pago arriba para llenar los datos del beneficiario.</p>
            </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
            <h3 className="text-xl font-black text-slate-800">Nueva <span className="text-red-700">Solicitud</span></h3>
            <button onClick={onClose} className="text-slate-400 hover:text-red-700 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Sección General */}
            <div className="space-y-1">
                <label className={labelClass}>Solicitante</label>
                <input name="solicitante" value={formData.solicitante} onChange={handleChange} required className={inputClass} placeholder="Nombre del solicitante" />
            </div>
            
            <div className="space-y-1">
                <label className={labelClass}>Tipo de Pago</label>
                <SelectorTiposPago 
                    name="tipo_pago"
                    value={formData.tipo_pago}
                    onChange={handleChange}
                    className={inputClass}
                    // Configuración API
                    labelKey="nombre"
                    valueKey="nombre"
                    // Filtro Global
                    allowedOptions={LISTA_OPCIONES_PERMITIDAS}
                />
            </div>

            <div className="space-y-1">
                <label className={labelClass}>Cuenta Contable</label>
                <select name="cuenta_contable_id" value={formData.cuenta_contable_id} onChange={handleChange} className={inputClass}>
                    <option value="">Seleccionar...</option>
                    <option value="1">Caja Chica</option>
                    <option value="2">Banco Nacional</option>
                </select>
            </div>
            <div className="space-y-1 md:col-span-3">
                <label className={labelClass}>Concepto</label>
                <input name="concepto" value={formData.concepto} onChange={handleChange} required className={inputClass} placeholder="Descripción del pago" />
            </div>

            {/* Sección Beneficiario (DINÁMICA) */}
            <div className="md:col-span-3 border-t border-slate-100 mt-2 pt-4">
                <h4 className="text-sm font-bold text-slate-700 mb-3">
                    Datos del Beneficiario {formData.tipo_pago ? `(${formData.tipo_pago})` : ''}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {renderCamposDinamicos()}
                </div>
            </div>

            {/* Sección Montos */}
            <div className="md:col-span-3 border-t border-slate-100 mt-2 pt-4"><h4 className="text-sm font-bold text-slate-700">Detalles del Pago</h4></div>

            <div className="space-y-1">
                <label className={labelClass}>Monto USD</label>
                <input type="number" step="0.01" name="monto_usd" value={formData.monto_usd} onChange={handleChange} required className={inputClass} />
            </div>
            <div className="space-y-1">
                <label className={labelClass}>Tasa</label>
                <input type="number" step="0.01" name="tasa" value={formData.tasa} onChange={handleChange} required className={inputClass} />
            </div>
            <div className="space-y-1">
                <label className={labelClass}>Monto BS (Calculado)</label>
                <input type="number" value={formData.monto_bs} readOnly className={`${inputClass} bg-slate-100 cursor-not-allowed`} />
            </div>

            {/* Sección Procesamiento */}
            <div className="space-y-1">
                <label className={labelClass}>Referencia</label>
                <input name="referencia" value={formData.referencia} onChange={handleChange} className={inputClass} />
            </div>
             <div className="space-y-1">
                <label className={labelClass}>Banco Origen</label>
                <input name="banco_origen" value={formData.banco_origen} onChange={handleChange} className={inputClass} />
            </div>
             <div className="space-y-1">
                <label className={labelClass}>Comprobante (Imagen/PDF)</label>
                <input type="file" onChange={handleFileChange} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"/>
            </div>

            {/* Footer Modal */}
            <div className="md:col-span-3 flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors">Cancelar</button>
                <button type="submit" className="bg-red-700 text-white px-8 py-2 rounded-lg font-bold hover:bg-red-800 shadow-lg shadow-red-100 transition-all active:scale-95">Guardar Solicitud</button>
            </div>
        </form>
      </div>
    </div>
  );
};


// ==========================================
// 3. COMPONENTE PRINCIPAL (Sin cambios mayores)
// ==========================================
const GestionPagos: React.FC = () => {
  const { empresaActual } = useAuth();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Efecto para cargar datos iniciales
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
      
      {/* Header y Botón Principal */}
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

      {/* Mensajes de Estado */}
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

      {/* Tabla de Resultados */}
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

      {/* Renderizado del Modal */}
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