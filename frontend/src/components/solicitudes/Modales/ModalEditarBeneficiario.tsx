import React, { useState, useEffect } from 'react';
import InputBeneficiarioAutocomplete from '../SelectSolicitudes/InputBeneficiarioAutocomplete';
import InputBancosAutocomplete from '../SelectSolicitudes/InputBancosAutocomplete';
import { toast } from 'sonner';
import axios from 'axios';
import { buildApiUrl } from '../../../config/api';

interface ModalEditarBeneficiarioProps {
    isOpen: boolean;
    onClose: () => void;
}

const ModalEditarBeneficiario: React.FC<ModalEditarBeneficiarioProps> = ({ isOpen, onClose }) => {
    const [beneficiarioId, setBeneficiarioId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Estado del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        rif: '',
        tipo_pago: '',
        banco: '',
        telefono: '',
        cuenta: '',
        email: ''
    });

    // Resetear al cerrar
    useEffect(() => {
        if (!isOpen) {
            setBeneficiarioId(null);
            setFormData({ nombre: '', rif: '', tipo_pago: '', banco: '', telefono: '', cuenta: '', email: '' });
        }
    }, [isOpen]);

    // Función al seleccionar en el buscador
    const handleSelectBeneficiario = (item: any) => {
        const idParaBackend = item.cuenta_id; 
        
        setBeneficiarioId(idParaBackend);
        
        // Desestructuramos el identificador según el tipo para rellenar los campos visuales
        let tel = '', cta = '', mail = '';
        const ident = item.identificador || '';
        if (item.tipo_pago === 'PAGO MOVIL') tel = ident;
        else if (item.tipo_pago === 'TRANSFERENCIA') cta = ident;
        else if (['ZELLE', 'BINANCE'].includes(item.tipo_pago)) mail = ident;

        setFormData({
            nombre: item.nombre,
            rif: item.rif,
            tipo_pago: item.tipo_pago,
            banco: item.banco || '',
            telefono: tel,
            cuenta: cta,
            email: mail
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value.toUpperCase() });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!beneficiarioId) return;

        setLoading(true);
        try {
            await axios.put(buildApiUrl(`/beneficiarios/editar/${beneficiarioId}`), formData, {
                withCredentials: true,
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            toast.success("Beneficiario actualizado correctamente");
            onClose(); // Cerramos la modal al terminar
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar");
        } finally {
            setLoading(false);
            console.log
        }
    };

    if (!isOpen) return null;

    const inputClass = "w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all uppercase";
    const labelClass = "text-[10px] font-bold text-slate-500 uppercase ml-1";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col min-h-[40vh] max-h-[1500vh] ">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-blue-50 ">
                    <h3 className="text-lg font-black text-blue-800">Editar Beneficiario</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-blue-700 font-bold p-2">✕</button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto min-h-[40vh]">
                    
                    {/* BUSCADOR */}
                    <div className="mb-6">
                        <label className="text-xs font-bold text-slate-700 mb-2 block">Buscar Beneficiario a Editar:</label>
                        <InputBeneficiarioAutocomplete 
                            onSelect={handleSelectBeneficiario} 
                            className="w-full border-10 border-blue-100 rounded-lg"
                            disabled={loading}
                        />
                    </div>

                    {/* FORMULARIO (Solo aparece si se seleccionó a alguien) */}
                    {beneficiarioId && (
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-down">
                            <div className="md:col-span-2 border-t border-slate-100 my-8"></div>

                            <div className="space-y-1">
                                <label className={labelClass}>Nombre / Razón Social</label>
                                <input name="nombre" value={formData.nombre} onChange={handleChange} className={inputClass} required />
                            </div>
                            <div className="space-y-1">
                                <label className={labelClass}>RIF / Cédula</label>
                                <input name="rif" value={formData.rif} onChange={handleChange} className={inputClass} required />
                            </div>

                            <div className="space-y-1 md:col-span-2">
                                <label className={labelClass}>Método de Pago</label>
                                <input name="tipo_pago" value={formData.tipo_pago} onChange={handleChange} className={inputClass} disabled />
                                
                                {/* <SelectorTiposPago name="tipo_pago" value={formData.tipo_pago} onChange={handleChange} className={inputClass} labelKey="nombre" valueKey="nombre" allowedOptions={['PAGO MOVIL', 'TRANSFERENCIA', 'ZELLE', 'BINANCE']}  /> */}
                            </div>

                            {/* Campos Dinámicos según Tipo */}
                            {(formData.tipo_pago === 'PAGO MOVIL' || formData.tipo_pago === 'TRANSFERENCIA') && (
                                <div className="space-y-1 md:col-span-2">
                                    <label className={labelClass}>Banco</label>
                                    <InputBancosAutocomplete name="banco" value={formData.banco} onChange={handleChange} className={inputClass} />
                                </div>
                            )}

                            {formData.tipo_pago === 'PAGO MOVIL' && (
                                <div className="space-y-1 md:col-span-2">
                                    <label className={labelClass}>Teléfono</label>
                                    <input name="telefono" value={formData.telefono} onChange={handleChange} className={inputClass} />
                                </div>
                            )}

                            {formData.tipo_pago === 'TRANSFERENCIA' && (
                                <div className="space-y-1 md:col-span-2">
                                    <label className={labelClass}>Número de Cuenta</label>
                                    <input name="cuenta" value={formData.cuenta} onChange={handleChange} className={inputClass} maxLength={20} />
                                </div>
                            )}

                            {(formData.tipo_pago === 'ZELLE' || formData.tipo_pago === 'BINANCE') && (
                                <div className="space-y-1 md:col-span-2">
                                    <label className={labelClass}>Correo / ID</label>
                                    <input name="email" value={formData.email} onChange={handleChange} className={inputClass} />
                                </div>
                            )}

                            <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setBeneficiarioId(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-bold">Cancelar Edición</button>
                                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 active:scale-95 transition-all">
                                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalEditarBeneficiario;