import React, { useState, useEffect } from 'react';
import InputBancosAutocomplete from '../SelectSolicitudes/InputBancosAutocomplete';
import { toast } from 'sonner';
import { buildApiUrl } from '../../../config/api';

// TIPOS Y CONSTANTES
const PREFIJOS_RIF = ['V', 'E', 'J', 'G', 'C', 'R'];

interface ModalEditarSolicitudProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void; // Para refrescar la tabla padre
    solicitud: any;       // La data original
    tasaBCV?: number;
}

const ModalEditarSolicitud: React.FC<ModalEditarSolicitudProps> = ({ 
    isOpen, onClose, onUpdate, solicitud, tasaBCV = 50.50 
}) => {
    
    const [loading, setLoading] = useState(false);
    const [rifPrefijo, setRifPrefijo] = useState('V');
    const [rifNumero, setRifNumero] = useState('');

    const [formData, setFormData] = useState({
        beneficiario_nombre: '',
        beneficiario_rif: '',
        beneficiario_banco: '',
        identificador: '', // Aquí guardamos cuenta, telefono o email segun corresponda
        tipo_pago: '',     // Solo lectura (no recomendamos cambiar el tipo de pago en edición simple)
        concepto: '',
        monto: 0,
        moneda: 'USD',
        tasa: 0,
        monto_calculado: 0
    });

    // 1. CARGAR DATOS AL ABRIR
    useEffect(() => {
        if (isOpen && solicitud) {
            // Desglosar RIF
            let p = 'V', n = '';
            if (solicitud.beneficiario_rif && !solicitud.beneficiario_rif.includes('ZELLE') && solicitud.beneficiario_rif.includes('-')) {
                [p, n] = solicitud.beneficiario_rif.split('-');
            } else if (solicitud.beneficiario_rif) {
                n = solicitud.beneficiario_rif;
            }
            setRifPrefijo(PREFIJOS_RIF.includes(p) ? p : 'V');
            setRifNumero(n);

            setFormData({
                beneficiario_nombre: solicitud.beneficiario_nombre,
                beneficiario_rif: solicitud.beneficiario_rif,
                beneficiario_banco: solicitud.beneficiario_banco,
                identificador: solicitud.beneficiario_identificador,
                tipo_pago: solicitud.tipo_pago,
                concepto: solicitud.concepto,
                monto: Number(solicitud.monto),
                moneda: solicitud.moneda_pago,
                tasa: Number(solicitud.tasa_cambio) || tasaBCV,
                monto_calculado: 0 // Se calculará abajo
            });
        }
    }, [isOpen, solicitud]);

    // 2. SINCRONIZAR RIF Y MONTOS
    useEffect(() => {
        // Solo actualizar RIF si no es Zelle/Binance
        if (!formData.tipo_pago.includes('ZELLE') && !formData.tipo_pago.includes('BINANCE')) {
            setFormData(prev => ({ ...prev, beneficiario_rif: `${rifPrefijo}-${rifNumero}` }));
        }
    }, [rifPrefijo, rifNumero]);

    // Calculo automático de referencia
    useEffect(() => {
        if (formData.moneda === 'VES') {
            const ref = formData.tasa > 0 ? (formData.monto / formData.tasa) : 0;
            setFormData(prev => ({ ...prev, monto_calculado: parseFloat(ref.toFixed(2)) }));
        } else {
            const bs = formData.monto * formData.tasa;
            setFormData(prev => ({ ...prev, monto_calculado: parseFloat(bs.toFixed(2)) }));
        }
    }, [formData.monto, formData.tasa, formData.moneda]);


    // HANDLERS
    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                // Si es Zelle, el RIF se mantiene o se regenera virtualmente, aquí asumimos que se mantiene el editado o el original
                beneficiario_rif: (formData.tipo_pago === 'ZELLE' || formData.tipo_pago === 'BINANCE') 
                    ? formData.beneficiario_rif 
                    : `${rifPrefijo}-${rifNumero}`
            };

            const response = await fetch(buildApiUrl(`/solicitudes/editar/${solicitud.id}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success("Solicitud actualizada");
                onUpdate(); // Refrescar tabla padre
                onClose();
            } else {
                const err = await response.json();
                toast.error(err.message || "Error al actualizar");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputClass = "w-full p-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 outline-none";
    const labelClass = "text-[10px] font-bold text-slate-500 uppercase ml-1";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                <div className="p-5 bg-yellow-50 border-b border-yellow-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-black text-yellow-800">Editar Solicitud #{solicitud?.id}</h3>
                        <p className="text-xs text-yellow-600">Corrija los datos necesarios</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-700 font-bold">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* NOMBRE */}
                        <div className="md:col-span-2">
                            <label className={labelClass}>Beneficiario</label>
                            <input name="beneficiario_nombre" value={formData.beneficiario_nombre} onChange={handleChange} className={inputClass} required disabled/>
                        </div>

                        {/* RIF (Solo si no es Zelle/Binance visualmente) */}
                        {(!formData.tipo_pago.includes('ZELLE') && !formData.tipo_pago.includes('BINANCE')) && (
                            <div>
                                <label className={labelClass}>Cédula/RIF</label>
                                <div className="flex">
                                    <select value={rifPrefijo} onChange={e => setRifPrefijo(e.target.value)} className="bg-slate-100 border border-slate-300 rounded-l-lg px-2 text-sm font-bold">
                                        {PREFIJOS_RIF.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <input value={rifNumero} onChange={e => setRifNumero(e.target.value)} className={`${inputClass} rounded-l-none`} />
                                </div>
                            </div>
                        )}

                        {/* BANCO Y CUENTA/IDENTIFICADOR */}
                        {formData.tipo_pago !== 'EFECTIVO USD' && (
                            <>
                                <div>
                                    <label className={labelClass}>Banco</label>
                                    <InputBancosAutocomplete name="beneficiario_banco" value={formData.beneficiario_banco} onChange={handleChange} className={inputClass} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelClass}>
                                        {formData.tipo_pago === 'PAGO MOVIL' ? 'Teléfono' : 
                                         formData.tipo_pago === 'TRANSFERENCIA' ? 'Nro Cuenta' : 'Correo / User ID'}
                                    </label>
                                    <input name="identificador" value={formData.identificador} onChange={handleChange} className={inputClass} required />
                                </div>
                            </>
                        )}

                        {/* MONTOS */}
                        <div className="border-t border-slate-100 md:col-span-2 my-2 pt-2"></div>

                        <div>
                            <label className={labelClass}>Monto ({formData.moneda})</label>
                            <input type="number" step="0.01" name="monto" value={formData.monto} onChange={handleChange} className={`${inputClass} font-bold`} required />
                        </div>

                        {formData.moneda === 'VES' && (
                            <div>
                                <label className={labelClass}>Tasa Cambio</label>
                                <input type="number" step="0.01" name="tasa" value={formData.tasa} onChange={handleChange} className={inputClass} />
                            </div>
                        )}

                        <div className="md:col-span-2">
                            <label className={labelClass}>Concepto</label>
                            <input name="concepto" value={formData.concepto} onChange={handleChange} className={inputClass} />
                        </div>

                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-500 hover:bg-slate-100 font-bold text-sm">Cancelar</button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="px-6 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-sm shadow-lg shadow-yellow-200 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalEditarSolicitud;