import React, { useState } from 'react';
// 1. CORRECCIÓN: Importamos SERVER_URL (la raíz http://ip:4500)
import { SERVER_URL } from '../../../config/api';


interface ModalDetalleSolicitudProps {
    isOpen: boolean;
    onClose: () => void;
    solicitud: any;
}

const ModalDetalleSolicitud: React.FC<ModalDetalleSolicitudProps> = ({ 
    isOpen, onClose, solicitud 
}) => {
    
    const [zoomUrl, setZoomUrl] = useState<string | null>(null);
    
    // NUEVO ESTADO: Para controlar si el concepto se muestra completo o cortado
    const [expandConcepto, setExpandConcepto] = useState(false);

    if (!isOpen || !solicitud) return null;

    // Estilos
    const labelClass = "text-[10px] font-bold text-slate-500 uppercase mb-1 block";
    const dataClass = "w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium font-mono";
    const sectionTitleClass = "flex items-center gap-2 mb-3 mt-4 first:mt-0";
    const badgeClass = "bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded";

    const formatMonto = (amount: any, currency: string) => {
        return `${Number(amount).toFixed(2)} ${currency === 'VES' ? 'Bs' : '$'}`;
    }

    // 2. CORRECCIÓN LÓGICA DE URL
    const getImagenUrl = (url: string) => {
        if (!url) return null;
        
        // Si ya viene completa (ej: Cloudinary o S3), la dejamos igual
        if (url.startsWith('http')) return url;
        
        // Si es local, le pegamos la Raíz del Servidor (no la de la API)
        // Aseguramos que la url empiece con /
        const cleanPath = url.startsWith('/') ? url : `/${url}`;
        return `${SERVER_URL}${cleanPath}`;
    };

    // --- LÓGICA CLAVE: Recuperar el array de pagos ---
    const historialPagos = (solicitud.pagos && solicitud.pagos.length > 0) 
        ? solicitud.pagos 
        : (solicitud.total_pagado > 0 ? [{
            id: 'legacy',
            creado_en: solicitud.updated_at || solicitud.creado_en,
            banco_origen: solicitud.banco_origen,
            referencia: solicitud.referencia_pago,
            monto_pagado: solicitud.total_pagado,
            comprobante: solicitud.comprobante_url // Usamos 'comprobante' genérico
          }] : []);

    const deudaPendiente = Math.max(0, parseFloat(solicitud.monto) - parseFloat(solicitud.total_pagado || 0));

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
                    
                    {/* Header */}
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-blue-50 rounded-t-xl">
                        <div>
                            <h3 className="text-xl font-black text-blue-800">Detalles de la Solicitud</h3>
                            <p className="text-xs text-blue-600">ID: #{solicitud.id} • Fecha: {new Date(solicitud.creado_en).toLocaleDateString()} • Solicitante: {solicitud.solicitante}</p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-red-700 font-bold p-2 transition-colors">✕</button>
                    </div>

                    <div className="p-6">
                        
                        {/* SECCIÓN 1: DATOS GENERALES */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Beneficiario */}
                            <div className="space-y-3">
                                <div className={sectionTitleClass}>
                                    <span className={badgeClass}>BENEFICIARIO</span>
                                    <div className="h-px bg-slate-200 flex-1"></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className={labelClass}>Nombre</label><div className={dataClass}>{solicitud.beneficiario_nombre}</div></div>
                                    <div><label className={labelClass}>Documento</label><div className={dataClass}>{solicitud.beneficiario_rif}</div></div>
                                    <div className="col-span-2">
                                        <label className={labelClass}>Destino ({solicitud.tipo_pago})</label>
                                        <div className={dataClass}>{solicitud.beneficiario_banco} - {solicitud.beneficiario_identificador}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Resumen Financiero */}
                            <div className="space-y-3">
                                <div className={sectionTitleClass}>
                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded border border-green-200">ESTADO DE CUENTA</span>
                                    <div className="h-px bg-green-200 flex-1"></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Monto Total</label>
                                        <div className="text-lg font-black text-slate-700">{formatMonto(solicitud.monto, solicitud.moneda_pago)}</div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Total Pagado</label>
                                        <div className="text-lg font-black text-green-600">{formatMonto(solicitud.total_pagado || 0, solicitud.moneda_pago)}</div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Pendiente</label>
                                        <div className={`text-base font-bold ${deudaPendiente > 0.01 ? 'text-red-500' : 'text-slate-400'}`}>
                                            {formatMonto(deudaPendiente, solicitud.moneda_pago)}
                                        </div>
                                    </div>
                                    
                                    {/* --- AQUÍ ESTÁ EL CAMBIO DEL CONCEPTO --- */}
                                    <div>
                                        <label className={labelClass}>Concepto</label>
                                        <div 
                                            onClick={() => setExpandConcepto(!expandConcepto)}
                                            className={`text-xs text-slate-500 italic cursor-pointer transition-all duration-200 border border-transparent hover:border-slate-200 hover:bg-slate-50 rounded p-1 ${
                                                expandConcepto ? 'whitespace-normal break-words h-auto bg-slate-50' : 'truncate'
                                            }`}
                                            title="Clic para ver completo"
                                        >
                                            {solicitud.concepto}
                                        </div>
                                    </div>
                                    {/* ---------------------------------------- */}

                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: HISTORIAL DE PAGOS */}
                        <div className="mt-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100">HISTORIAL DE TRANSACCIONES</span>
                                <div className="h-px bg-blue-100 flex-1"></div>
                            </div>

                            {historialPagos.length > 0 ? (
                                <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                                            <tr>
                                                <th className="px-4 py-2 border-b">Fecha</th>
                                                <th className="px-4 py-2 border-b">Banco Origen</th>
                                                <th className="px-4 py-2 border-b">Referencia</th>
                                                <th className="px-4 py-2 border-b text-right">Monto</th>
                                                <th className="px-4 py-2 border-b text-center">Comprobante</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {historialPagos.map((pago: any, index: number) => {
                                                const img = getImagenUrl(pago.comprobante_url || pago.comprobante);
                                                console.log('ruta de la imagen del comprobante:', img);
                                                return (
                                                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-2 text-slate-500 font-mono text-xs">
                                                            {new Date(pago.creado_en).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-4 py-2 text-slate-700 font-medium text-xs">
                                                            {pago.banco_origen || '-'}
                                                        </td>
                                                        <td className="px-4 py-2 text-slate-600 font-mono text-xs">
                                                            {pago.referencia || pago.referencia_pago || '-'}
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-bold text-green-700 text-xs">
                                                            {formatMonto(pago.monto_pagado, solicitud.moneda_pago)}
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            {img ? (
                                                                <button 
                                                                    onClick={() => setZoomUrl(img)}
                                                                    className="text-blue-600 hover:text-blue-800 text-[10px] font-bold underline flex items-center justify-center gap-1 mx-auto bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                                                                >
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                    Ver
                                                                </button>
                                                            ) : (
                                                                <span className="text-slate-300 text-[10px] italic">Sin foto</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 text-xs">
                                    No hay registros de pagos asociados.
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 flex justify-end">
                        <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-900 transition-colors">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>

            {/* --- VISOR DE ZOOM (LIGHTBOX) --- */}
            {zoomUrl && (
                <div 
                    className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setZoomUrl(null)}
                >
                    <button 
                        onClick={() => setZoomUrl(null)}
                        className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <img 
                        src={zoomUrl} 
                        alt="Comprobante Zoom" 
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}
        </>
    );
};

export default ModalDetalleSolicitud;