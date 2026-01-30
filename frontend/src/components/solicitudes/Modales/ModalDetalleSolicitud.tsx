import React, { useState } from 'react';

// URL Base del Backend
const API_BASE_URL = 'http://localhost:4500'; 

interface ModalDetalleSolicitudProps {
    isOpen: boolean;
    onClose: () => void;
    solicitud: any;
}

const ModalDetalleSolicitud: React.FC<ModalDetalleSolicitudProps> = ({ 
    isOpen, onClose, solicitud 
}) => {
    
    // --- NUEVO ESTADO PARA EL ZOOM ---
    const [zoomOpen, setZoomOpen] = useState(false);

    if (!isOpen || !solicitud) return null;

    // Estilos
    const labelClass = "text-[10px] font-bold text-slate-500 uppercase mb-1 block";
    const dataClass = "w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium font-mono";
    const sectionTitleClass = "flex items-center gap-2 mb-3 mt-4 first:mt-0";
    const badgeClass = "bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded";

    const formatMonto = (amount: any, currency: string) => {
        return `${Number(amount).toFixed(2)} ${currency === 'VES' ? 'Bs' : '$'}`;
    }

    const getImagenUrl = (url: string) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${API_BASE_URL}${url}`;
    };

    const imgUrl = getImagenUrl(solicitud.comprobante_url || solicitud.comprobante);

    return (
        <>
            {/* --- MODAL PRINCIPAL --- */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
                    
                    {/* Header */}
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-blue-50 rounded-t-xl">
                        <div>
                            <h3 className="text-xl font-black text-blue-800">Detalles de la Solicitud</h3>
                            <p className="text-xs text-blue-600">ID: #{solicitud.id} • Creado el {new Date(solicitud.creado_en).toLocaleDateString()}</p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-red-700 font-bold p-2 transition-colors">✕</button>
                    </div>

                    <div className="p-6">
                        
                        {/* SECCIÓN 1: BENEFICIARIO */}
                        <div className={sectionTitleClass}>
                            <span className={badgeClass}>BENEFICIARIO</span>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <div>
                                <label className={labelClass}>Nombre / Razón Social</label>
                                <div className={dataClass}>{solicitud.beneficiario_nombre}</div>
                            </div>
                            <div>
                                <label className={labelClass}>Documento (RIF/CI)</label>
                                <div className={dataClass}>{solicitud.beneficiario_rif}</div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: DATOS DE LA SOLICITUD */}
                        <div className={sectionTitleClass}>
                            <span className={badgeClass}>SOLICITUD Y CONCEPTO</span>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <div className="md:col-span-2">
                                <label className={labelClass}>Concepto</label>
                                <div className={`${dataClass} whitespace-normal`}>{solicitud.concepto}</div>
                            </div>
                            <div>
                                <label className={labelClass}>Método Destino</label>
                                <div className={dataClass}>{solicitud.tipo_pago}</div>
                            </div>
                            <div>
                                <label className={labelClass}>Datos de Cuenta / Móvil</label>
                                <div className={dataClass}>
                                    {solicitud.beneficiario_banco ? `${solicitud.beneficiario_banco} - ` : ''}
                                    {solicitud.beneficiario_identificador}
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Solicitado Por</label>
                                <div className={dataClass}>{solicitud.solicitante}</div>
                            </div>
                        </div>

                        {/* SECCIÓN 3: INFORMACIÓN DEL PAGO */}
                        <div className={sectionTitleClass}>
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded border border-green-200">EJECUCIÓN DEL PAGO</span>
                            <div className="h-px bg-green-200 flex-1"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-green-50/30 p-4 rounded-xl border border-green-100">
                            <div>
                                <label className={labelClass}>Monto Total</label>
                                <div className="text-lg font-black text-slate-700">{formatMonto(solicitud.monto, solicitud.moneda_pago)}</div>
                            </div>
                            <div>
                                <label className={labelClass}>Total Pagado</label>
                                <div className="text-lg font-black text-green-600">{formatMonto(solicitud.total_pagado || 0, solicitud.moneda_pago)}</div>
                            </div>
                            <div>
                                <label className={labelClass}>Estatus</label>
                                <div className={`text-xs font-bold uppercase mt-1 ${solicitud.estado_pago === 1 ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {solicitud.estado_pago === 1 ? 'PAGADO COMPLETO' : 'ABONADO / PENDIENTE'}
                                </div>
                            </div>

                            <div className="md:col-span-1">
                                <label className={labelClass}>Banco Origen</label>
                                <div className={dataClass}>{solicitud.banco_origen || '-'}</div>
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>Referencia(s)</label>
                                <div className={dataClass}>{solicitud.referencia_pago || '-'}</div>
                            </div>
                        </div>

                        {/* COMPROBANTE CON ZOOM */}
                        {imgUrl ? (
                            <div className="mt-4">
                                <label className={labelClass}>Comprobante Adjunto</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-2 flex justify-center bg-slate-50 transition-colors hover:bg-slate-100">
                                    {/* Reemplazamos <a> por un div clickeable */}
                                    <div 
                                        onClick={() => setZoomOpen(true)}
                                        className="relative group cursor-zoom-in"
                                        title="Clic para ampliar"
                                    >
                                        <img 
                                            src={imgUrl} 
                                            alt="Comprobante" 
                                            className="h-64 object-contain rounded shadow-sm group-hover:opacity-90 transition-opacity bg-white" 
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x150?text=Error+Cargando+Imagen';
                                            }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                                🔍 Ampliar Imagen
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 p-4 text-center text-slate-400 text-sm border border-slate-100 rounded-lg">
                                Sin comprobante adjunto
                            </div>
                        )}
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
            {zoomOpen && imgUrl && (
                <div 
                    className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setZoomOpen(false)} // Cierra al hacer clic en el fondo
                >
                    {/* Botón Cerrar Flotante */}
                    <button 
                        onClick={() => setZoomOpen(false)}
                        className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    {/* Imagen Grande */}
                    <img 
                        src={imgUrl} 
                        alt="Comprobante Zoom" 
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()} // Evita cerrar si clickeas la imagen misma
                    />
                </div>
            )}
        </>
    );
};

export default ModalDetalleSolicitud;