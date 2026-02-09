import React, { useState, useEffect } from 'react';
import InputBancosAutocomplete from '../SelectSolicitudes/InputBancosAutocomplete';
import SelectCuenta from '../../selectoresContables/SelectCuenta';
import { toast } from 'sonner';
import { useAuth } from '../../../context/AuthContext';

interface ModalProcesarPagoProps {
    isOpen: boolean;
    onClose: () => void;
    onProcesar: (idSolicitud: number, datosPago: any) => Promise<void> | void;
    solicitud: any;
}

const ModalProcesarPago: React.FC<ModalProcesarPagoProps> = ({ 
    isOpen, onClose, onProcesar, solicitud 
}) => {
    //usuario para comparar la edicion
        const {usuario} = useAuth();
    // ... (Mismos estados y lógica de antes) ...
    const [bancoOrigen, setBancoOrigen] = useState('');
    const [referencia, setReferencia] = useState('');
    const [comprobante, setComprobante] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [modoPago, setModoPago] = useState<'completo' | 'abono'>('completo');
    const [montoAbono, setMontoAbono] = useState<string>('');
    const [tasaApi, setTasaApi] = useState(0); 
    const [origenTasa, setOrigenTasa] = useState<'REGISTRADA' | 'ACTUAL' | 'MANUAL'>('REGISTRADA');
    const [tasaAplicada, setTasaAplicada] = useState<string>(''); 

    const montoTotalOriginal = solicitud ? parseFloat(solicitud.monto || 0) : 0;
    const pagadoAnteriormente = solicitud ? parseFloat(solicitud.total_pagado || 0) : 0;
    const deudaPendiente = Math.max(0, montoTotalOriginal - pagadoAnteriormente);
    const montoAbonoNum = parseFloat(montoAbono) || 0;
    const montoFinal = modoPago === 'completo' ? deudaPendiente : montoAbonoNum;
    const restante = Math.max(0, deudaPendiente - montoFinal);
    const esDolar = solicitud?.moneda_pago === 'USD';

    useEffect(() => {
        if (isOpen && solicitud) {
            setBancoOrigen('');
            setReferencia('');
            setComprobante(null);
            setPreviewUrl(null);
            setModoPago('completo');
            setMontoAbono('');
            const tasaRegistrada = solicitud.tasa_cambio || '';
            setTasaAplicada(tasaRegistrada);
            setOrigenTasa('REGISTRADA');
            if (!esDolar) {
                fetch('https://ve.dolarapi.com/v1/dolares/oficial')
                    .then(res => res.json())
                    .then(data => { if (data && data.promedio) setTasaApi(parseFloat(data.promedio)); })
                    .catch(console.error);
            }
        }
    }, [isOpen, solicitud, esDolar]);

    const handleCambioOrigenTasa = (nuevoOrigen: 'REGISTRADA' | 'ACTUAL' | 'MANUAL') => {
        setOrigenTasa(nuevoOrigen);
        if (nuevoOrigen === 'REGISTRADA') setTasaAplicada(solicitud.tasa_cambio || '');
        else if (nuevoOrigen === 'ACTUAL') setTasaAplicada(tasaApi.toString());
    };

    // ... (Mismos efectos de Paste e Imagen) ...
    useEffect(() => {
        const handleWindowPaste = (e: ClipboardEvent) => {
            if (!isOpen) return;
            if (e.clipboardData && e.clipboardData.files.length > 0) {
                const file = e.clipboardData.files[0];
                if (file.type.startsWith('image/')) {
                    e.preventDefault();
                    setComprobante(file);
                    setPreviewUrl(URL.createObjectURL(file));
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
            if (!imagenEncontrada) toast.warning("No se encontró imagen en portapapeles");
        } catch (err) {
            toast.error("Permiso denegado por el navegador");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bancoOrigen || !referencia) { toast.error("Faltan datos"); return; }
        if (montoFinal <= 0) { toast.error("Monto inválido"); return; }
        if (modoPago === 'abono' && montoFinal > deudaPendiente + 0.01) { toast.warning("Monto Excedido"); return; }
        
        setLoading(true);
        const datosPago = {
            banco_origen: bancoOrigen,
            referencia: referencia,
            comprobante: comprobante,
            monto_pagado: montoFinal,
            es_abono: restante > 0.01,
            tasa_cambio: esDolar ? null : tasaAplicada 
        };

        try {
            await onProcesar(solicitud.id, datosPago);
            toast.success(modoPago === 'completo' ? "¡Pago Completado!" : "Abono Registrado");
        } catch (error) {
            console.error(error);
            toast.error("Error al procesar");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !solicitud) return null;

    const labelClass = "text-[10px] font-bold text-slate-500 uppercase mb-1 block";
    const inputDisabledClass = "w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium outline-none cursor-not-allowed";
    const inputActiveClass = "w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-600 outline-none transition-all font-bold text-slate-800";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            
            {/* CORRECCIÓN DE DISEÑO: FLEX COLUMN + OVERFLOW HIDDEN */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                
                {/* Header (Fijo) */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-green-50 shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-green-800">Procesar Pago</h3>
                        <p className="text-xs text-green-600">ID Solicitud: #{solicitud.id} • Fecha: {new Date(solicitud.creado_en).toLocaleDateString()} • Solicitante: {solicitud.solicitante}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-700 font-bold p-2">✕</button>
                </div>

                {/* Body (Scrolleable) */}
                <div className="overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* SECCIÓN 1: DATOS (SOLO LECTURA) */}
                        <div className="md:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-90 p-2 mb-0.5 bg-[#fee089] rounded-lg">
                                {/* ... Datos informativos ... */}
                                <div className="md:col-span-1">
                                    <label className={labelClass}>Deuda Pendiente</label>
                                    <div className="relative">
                                        <input value={deudaPendiente.toFixed(2)} disabled className={inputDisabledClass} />
                                        <span className="absolute right-3 top-2 text-xs font-bold text-slate-500">{solicitud.moneda_pago === 'VES' ? 'Bs' : '$'}</span>
                                    </div>
                                </div>
                                <div className="md:col-span-1">
                                    <label className={labelClass}>Valor de referencia ($)</label>
                                    <input value={solicitud.referencia_usd ? `$${solicitud.referencia_usd}` : '-'} disabled className={inputDisabledClass} />
                                </div>
                                <div className="md:col-span-1">
                                    <label className={labelClass}>Tasa de Solicitante</label>
                                    <input value={solicitud.tasa_cambio || '-'} disabled className={inputDisabledClass} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-90 p-4 bg-slate-50 rounded-lg mt-2">
                                <div><label className={labelClass}>Beneficiario</label><input value={solicitud.beneficiario_nombre || ''} disabled className={inputDisabledClass} /></div>
                                <div className="md:col-span-2"><label className={labelClass}>RIF / ID</label><input value={solicitud.beneficiario_rif || ''} disabled className={inputDisabledClass} /></div>
                                
                                <div className="md:col-span-1"><label className={labelClass}>Método</label><input value={solicitud.tipo_pago || 'N/A'} disabled className={inputDisabledClass} /></div>
                                <div className="md:col-span-2"><label className={labelClass}>Cuenta / Identificador</label><input value={`${(solicitud.beneficiario_banco || '').slice(0,35)} / ${solicitud.beneficiario_identificador || ''}`} disabled className={inputDisabledClass} /></div>
                                
                                <div className="md:col-span-1"><label className={labelClass}>Concepto Contable</label><input value={solicitud.concepto_contable || ''} disabled className={inputDisabledClass} /></div>
                                <div className="md:col-span-2"><label className={labelClass}>Descripcion</label><input value={solicitud.concepto || ''} disabled className={inputDisabledClass} /></div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: DATOS DEL PAGO */}
                        <div className="md:col-span-2 mt-2">
                            <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                                <button type="button" onClick={() => setModoPago('completo')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${modoPago === 'completo' ? 'bg-white text-green-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-600'}`}>Pago Completo</button>
                                <button type="button" onClick={() => setModoPago('abono')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${modoPago === 'abono' ? 'bg-white text-green-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-600'}`}>Abonar</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-green-50/30 rounded-xl border border-green-100">
                                
                                {modoPago === 'abono' && (
                                    <div className="md:col-span-2 animate-fade-in-down">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Monto a Pagar</label>
                                                <input type="number" step="0.01" value={montoAbono} onChange={(e) => setMontoAbono(e.target.value)} className={inputActiveClass} placeholder="0.00" autoFocus />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Restante</label>
                                                <div className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-right font-mono font-bold text-slate-500">
                                                    {restante.toFixed(2)} {solicitud.moneda_pago === 'VES' ? 'Bs' : '$'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className={labelClass}>Cuenta de Origen</label>
                                    <SelectCuenta name="banco_origen" value={bancoOrigen} onChange={setBancoOrigen} className="w-full hover:cursor-text" />
                                </div>

                                <div>
                                    <label className={labelClass}>Tasa de Cambio</label>
                                    {esDolar ? (
                                        <div className="relative"><input value="N/A (Divisa)" disabled className={inputDisabledClass} /></div>
                                    ) : (
                                        <div className="flex">
                                            <select value={origenTasa} onChange={(e) => handleCambioOrigenTasa(e.target.value as any)} className="bg-green-100 border border-green-200 text-xs font-bold text-green-800 rounded-l-lg px-2 outline-none focus:bg-white transition-colors cursor-pointer w-28">
                                                <option value="REGISTRADA">Registrada</option>
                                                <option value="ACTUAL">Actual BCV</option>
                                                <option value="MANUAL">Manual</option>
                                            </select>
                                            <input type="number" step="0.01" value={tasaAplicada} onChange={(e) => setTasaAplicada(e.target.value)} readOnly={origenTasa !== 'MANUAL'} className={`w-full p-2.5 border border-l-0 border-green-200 rounded-r-lg text-sm outline-none transition-all ${origenTasa !== 'MANUAL' ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-800 focus:ring-2 focus:ring-green-600'}`} placeholder="0.00" />
                                        </div>
                                    )}
                                    {origenTasa === 'ACTUAL' && !esDolar && (<p className="text-[9px] text-green-600 mt-1 ml-1">Tasa BCV del día: {tasaApi}</p>)}
                                </div>

                                <div className="md:col-span-2">
                                    <label className={labelClass}>Nro. Referencia</label>
                                    <input type="text" value={referencia} onChange={(e) => setReferencia(e.target.value)} className={inputActiveClass} placeholder="Ultimos 6 digitos" required />
                                </div>

                                <div className="md:col-span-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className={labelClass}>Comprobante</label>
                                        <button type="button" onClick={handlePasteImage} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded cursor-pointer transition-colors">Pegar (Ctrl+V)</button>
                                    </div>
                                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg bg-white relative">
                                        <div className="space-y-1 text-center">
                                            {previewUrl ? (
                                                <div className="relative">
                                                    <img src={previewUrl} alt="Vista previa" className="mx-auto h-24 object-contain rounded-md" />
                                                    <button type="button" onClick={() => {setComprobante(null); setPreviewUrl(null);}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs font-bold">✕</button>
                                                </div>
                                            ) : (
                                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500">
                                                    <span>Subir imagen</span>
                                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*,.pdf" onChange={handleFileChange} />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer (Dentro del scroll para no tapar en pantallas pequeñas o muévelo fuera del form si prefieres fijo) */}
                        <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                            <button type="button" onClick={onClose} disabled={loading} className="px-6 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-50">Cancelar</button>
                            <button type="submit" disabled={loading} className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-100 active:scale-95 flex items-center gap-2">
                                {loading ? 'Procesando...' : (modoPago === 'completo' ? 'Confirmar Pago' : 'Registrar Abono')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ModalProcesarPago;