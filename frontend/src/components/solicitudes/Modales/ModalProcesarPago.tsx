import React, { useState, useEffect } from 'react';
import InputBancosAutocomplete from '../SelectSolicitudes/InputBancosAutocomplete';
import SelectCuenta from '../../selectoresContables/SelectCuenta';
import { toast } from 'sonner'; // ✅ Importado correctamente

interface ModalProcesarPagoProps {
    isOpen: boolean;
    onClose: () => void;
    onProcesar: (idSolicitud: number, datosPago: any) => Promise<void> | void; // Soportamos promesas
    solicitud: any;
}

const ModalProcesarPago: React.FC<ModalProcesarPagoProps> = ({ 
    isOpen, onClose, onProcesar, solicitud 
}) => {
    
    // Estados básicos
    const [bancoOrigen, setBancoOrigen] = useState('');
    const [referencia, setReferencia] = useState('');
    const [comprobante, setComprobante] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Estados: Lógica de Abono
    const [modoPago, setModoPago] = useState<'completo' | 'abono'>('completo');
    const [montoAbono, setMontoAbono] = useState<string>('');

    // --- CÁLCULOS LÓGICOS ---
    const montoTotalOriginal = solicitud ? parseFloat(solicitud.monto || 0) : 0;
    const pagadoAnteriormente = solicitud ? parseFloat(solicitud.total_pagado || 0) : 0;
    
    // 1. Deuda real pendiente
    const deudaPendiente = Math.max(0, montoTotalOriginal - pagadoAnteriormente);

    // 2. Monto a pagar en esta operación
    const montoAbonoNum = parseFloat(montoAbono) || 0;
    const montoFinal = modoPago === 'completo' ? deudaPendiente : montoAbonoNum;
    
    // 3. Restante después de este pago
    const restante = Math.max(0, deudaPendiente - montoFinal);

    useEffect(() => {
        if (isOpen) {
            setBancoOrigen('');
            setReferencia('');
            setComprobante(null);
            setPreviewUrl(null);
            setModoPago('completo');
            setMontoAbono('');
        }
    }, [isOpen, solicitud]);

    // --- MANEJO DE PEGAR IMAGEN (CTRL + V) ---
    useEffect(() => {
        const handleWindowPaste = (e: ClipboardEvent) => {
            if (!isOpen) return;
            if (e.clipboardData && e.clipboardData.files.length > 0) {
                const file = e.clipboardData.files[0];
                if (file.type.startsWith('image/')) {
                    e.preventDefault();
                    setComprobante(file);
                    setPreviewUrl(URL.createObjectURL(file));
                    // Feedback visual sutil
                    toast.info("Imagen pegada desde portapapeles");
                }
            }
        };
        window.addEventListener('paste', handleWindowPaste);
        return () => window.removeEventListener('paste', handleWindowPaste);
    }, [isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setComprobante(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // --- BOTÓN PEGAR MANUAL ---
    const handlePasteImage = async () => {
        try {
            const clipboardItems = await navigator.clipboard.read();
            let imagenEncontrada = false;

            for (const item of clipboardItems) {
                const imageType = item.types.find(type => type.startsWith('image/'));
                if (imageType) {
                    const blob = await item.getType(imageType);
                    const file = new File([blob], "captura_portapapeles.png", { type: imageType });
                    setComprobante(file);
                    setPreviewUrl(URL.createObjectURL(file));
                    imagenEncontrada = true;
                    toast.success("Imagen adjuntada correctamente");
                    break; 
                }
            }

            if (!imagenEncontrada) {
                // ANTES: alert(...) -> AHORA: toast
                toast.warning("No se encontró imagen", {
                    description: "Asegúrate de copiar la imagen (Click derecho > Copiar imagen) y no el archivo."
                });
            }
        } catch (err) {
            console.error("Error al leer portapapeles:", err);
            toast.error("Permiso denegado", {
                description: "Tu navegador bloqueó el acceso. Haz clic en la modal y presiona Ctrl + V."
            });
        }
    };

    // --- ENVÍO DEL FORMULARIO ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 1. Validaciones con TOASTS
        if (!bancoOrigen || !referencia) {
            toast.error("Datos incompletos", {
                description: "El Banco de Origen y la Referencia son obligatorios."
            });
            return;
        }

        if (montoFinal <= 0) {
            toast.error("Monto inválido", {
                description: "El monto a pagar debe ser mayor a 0."
            });
            return;
        }

        if (modoPago === 'abono') {
            if (montoFinal > deudaPendiente + 0.01) { 
                toast.warning("Monto Excedido", {
                    description: `El abono (${montoFinal}) no puede ser mayor a la deuda pendiente (${deudaPendiente.toFixed(2)}).`
                });
                return;
            }
        }
        
        setLoading(true);
        
        const datosPago = {
            banco_origen: bancoOrigen,
            referencia: referencia,
            comprobante: comprobante,
            monto_pagado: montoFinal,
            es_abono: restante > 0.01 
        };

        try {
            // Esperamos a que la función padre procese
            await onProcesar(solicitud.id, datosPago);
            
            // ÉXITO
            toast.success(modoPago === 'completo' ? "¡Pago Completado!" : "Abono Registrado", {
                description: `Se procesaron ${montoFinal.toFixed(2)} ${solicitud.moneda_pago === 'VES' ? 'Bs' : '$'} correctamente.`
            });
            
            // La modal debería cerrarse desde el padre, pero por si acaso limpiamos loading
        } catch (error) {
            console.error(error);
            toast.error("Error al procesar", {
                description: "Ocurrió un error al guardar el pago. Intenta nuevamente."
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !solicitud) return null;

    // Estilos
    const labelClass = "text-[10px] font-bold text-slate-500 uppercase mb-1 block";
    const inputDisabledClass = "w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium outline-none cursor-not-allowed";
    const inputActiveClass = "w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-600 outline-none transition-all font-bold text-slate-800";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-green-50 rounded-t-xl">
                    <div>
                        <h3 className="text-xl font-black text-green-800">Procesar Pago</h3>
                        <p className="text-xs text-green-600">ID Solicitud: #{solicitud.id} • {new Date(solicitud.creado_en).toLocaleDateString()}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-700 font-bold p-2">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* SECCIÓN 1: DATOS DE LA SOLICITUD (SOLO LECTURA) */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">DATOS ORIGINALES</span>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-90">
                            <div>
                                <label className={labelClass}>Beneficiario</label>
                                <input value={solicitud.beneficiario_nombre || ''} disabled className={inputDisabledClass} />
                            </div>
                            <div>
                                <label className={labelClass}>RIF / ID</label>
                                <input value={solicitud.beneficiario_rif || ''} disabled className={inputDisabledClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Monto {pagadoAnteriormente > 0 ? 'Pendiente' : 'Total'}</label>
                                <div className="relative">
                                    <input 
                                        value={deudaPendiente.toFixed(2)} 
                                        disabled 
                                        className={`${inputDisabledClass} font-mono text-right pr-8 font-bold text-slate-700`} 
                                    />
                                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-500">{solicitud.moneda_pago === 'VES' ? 'Bs' : '$'}</span>
                                </div>
                            </div>
                            
                            <div className="md:col-span-1">
                                <label className={labelClass}>Método Destino</label>
                                <input value={solicitud.tipo_pago || 'N/A'} disabled className={inputDisabledClass} />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>Cuenta / Detalles Destino</label>
                                <input value={`${solicitud.beneficiario_banco || ''} - ${solicitud.beneficiario_identificador || ''}`} disabled className={inputDisabledClass} />
                            </div>

                            <div className="md:col-span-3">
                                <label className={labelClass}>Concepto / Motivo</label>
                                <input value={solicitud.concepto || ''} disabled className={inputDisabledClass} />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: DATOS DEL PAGO */}
                    <div className="md:col-span-2 mt-2">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded border border-green-200">DATOS DEL PAGO REALIZADO</span>
                            <div className="h-px bg-green-200 flex-1"></div>
                        </div>

                        {/* SLIDER TIPO PAGO */}
                        <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                            <button 
                                type="button"
                                onClick={() => setModoPago('completo')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${modoPago === 'completo' ? 'bg-white text-green-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-600'}`}
                            >
                                Pago Completo
                            </button>
                            <button 
                                type="button"
                                onClick={() => setModoPago('abono')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${modoPago === 'abono' ? 'bg-white text-green-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-600'}`}
                            >
                                Abonar
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-green-50/30 rounded-xl border border-green-100">
                            
                            {modoPago === 'abono' && (
                                <div className="md:col-span-2 animate-fade-in-down mb-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Cantidad a Transferir</label>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    value={montoAbono}
                                                    onChange={(e) => setMontoAbono(e.target.value)}
                                                    className={`${inputActiveClass} text-green-800 pr-8`}
                                                    placeholder="0.00"
                                                    autoFocus
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">{solicitud.moneda_pago === 'VES' ? 'Bs' : '$'}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Restante de la Cuenta</label>
                                            <div className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-right font-mono font-bold text-slate-500 flex justify-between items-center">
                                                <span className="text-[10px] uppercase">Por Pagar:</span>
                                                <span>{restante.toFixed(2)} {solicitud.moneda_pago === 'VES' ? 'Bs' : '$'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Banco Origen */}
                            <div>
                                <label className={labelClass}>Cuenta de Origen</label>
                                <SelectCuenta name="banco_origen" value={bancoOrigen} onChange={setBancoOrigen} className="w-full hover:cursor-text" />
                            </div>

                            {/* Referencia */}
                            <div>
                                <label className={labelClass}>Nro. Referencia</label>
                                <input 
                                    type="text" 
                                    value={referencia}
                                    onChange={(e) => setReferencia(e.target.value)}
                                    className={inputActiveClass}
                                    placeholder="Ultimos 6 digitos"
                                    required
                                />
                            </div>

                            {/* Carga de Comprobante */}
                            <div className="md:col-span-2">
                                <div className="flex justify-between items-center mb-1">
                                    <label className={labelClass}>Adjuntar Comprobante</label>
                                    <button 
                                        type="button" 
                                        onClick={handlePasteImage}
                                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded cursor-pointer transition-colors"
                                        title="Pegar desde el portapapeles (Ctrl + V)"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                        Pegar (Ctrl+V)
                                    </button>
                                </div>

                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:bg-white transition-colors bg-white relative">
                                    <div className="space-y-1 text-center">
                                        {previewUrl ? (
                                            <div className="relative">
                                                <img src={previewUrl} alt="Vista previa" className="mx-auto h-32 object-contain rounded-md" />
                                                <button 
                                                    type="button" 
                                                    onClick={() => {setComprobante(null); setPreviewUrl(null);}}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs font-bold"
                                                >✕</button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex text-sm text-slate-600 justify-center">
                                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none">
                                                        <span>Subir un archivo</span>
                                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*,.pdf" onChange={handleFileChange} />
                                                    </label>
                                                    <p className="pl-1">o arrastrar y soltar</p>
                                                </div>
                                                <p className="text-xs text-slate-500">PNG, JPG, PDF hasta 5MB</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Footer */}
                    <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={onClose} disabled={loading} className="px-6 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-50">Cancelar</button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-100 active:scale-95 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    {modoPago === 'completo' ? 'Confirmar Pago Total' : 'Registrar Abono'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalProcesarPago;