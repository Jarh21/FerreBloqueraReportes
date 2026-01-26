import React, { useState, useEffect } from 'react';
import InputBancosAutocomplete from '../SelectSolicitudes/InputBancosAutocomplete';
import {useAuth} from '../../../context/AuthContext';
import SelectorTiposPago from '../SelectSolicitudes/SelectorTipoPago';

const TIPOS_PAGO = {
  BINANCE: "BINANCE",
  TRANSFERENCIA: "TRANSFERENCIA",
  PAGO_MOVIL: "PAGO MOVIL",
  ZELLE: "ZELLE",
  EFECTIVO: "EFECTIVO USD"
};
const LISTA_OPCIONES_PERMITIDAS = Object.values(TIPOS_PAGO);

interface ModalSolicitudPagoProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: FormData, estadoPago?: number) => void;
    empresaId?: number | string;
    tasaBCV?: number;
    tasaEuro?: number;
}

const ModalSolicitudPago: React.FC<ModalSolicitudPagoProps> = ({ 
    isOpen, onClose, onSave, empresaId, 
    tasaBCV = 50.50, 
    tasaEuro = 55.20 
}) => {
  const {usuario} = useAuth();
  const [modoBeneficiario, setModoBeneficiario] = useState<'nuevo' | 'registrado'>('nuevo');
  const [guardarBeneficiario, setGuardarBeneficiario] = useState(false);
  // AJUSTE 1: Eliminamos 'EUR' del tipo
  const [moneda, setMoneda] = useState<'USD' | 'VES'>('USD');
  const [origenTasa, setOrigenTasa] = useState<'BCV' | 'EURO' | 'MANUAL'>('BCV');
  const [accionBoton, setAccionBoton] = useState<'guardar' | 'pagar'>('guardar');

  const [formData, setFormData] = useState({
    solicitante: usuario?.nombre,
    tipo_pago: '',
    concepto: '',
    cuenta_contable_id: '',
    beneficiario_id_seleccionado: '', 
    beneficiario_nombre: '',
    beneficiario_rif: '',
    beneficiario_banco: '', 
    beneficiario_telefono: '',
    beneficiario_cuenta: '',
    beneficiario_email: '', 
    monto: 0,      
    tasa: tasaBCV, 
    monto_calculado: 0, // Ahora este campo es editable en VES
    referencia: '',
    banco_origen: '',
    comprobante: null as File | null
  });

  // Actualizar valor de la tasa si cambia el origen (BCV/Euro)
  // Nota: Si el usuario ya escribió montos, podríamos querer recalcular aquí también.
  useEffect(() => {
    let nuevaTasa = formData.tasa;
    if (origenTasa === 'BCV') nuevaTasa = tasaBCV;
    else if (origenTasa === 'EURO') nuevaTasa = tasaEuro;

    // Si cambia la tasa automáticamente, recalculamos el REF ($) manteniendo los BS fijos
    if (origenTasa !== 'MANUAL' && moneda === 'VES') {
        const refDolares = nuevaTasa > 0 ? (formData.monto / nuevaTasa) : 0;
        setFormData(prev => ({ 
            ...prev, 
            tasa: nuevaTasa,
            monto_calculado: parseFloat(refDolares.toFixed(2))
        }));
    } else {
        // Si no es VES, solo actualizamos la tasa en el estado
        setFormData(prev => ({ ...prev, tasa: nuevaTasa }));
    }
  }, [origenTasa, tasaBCV, tasaEuro, moneda]);

  // AJUSTE 4: Lógica Bidireccional de Cálculo
  const handleFinancialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const valorNumerico = parseFloat(value) || 0;

    // Caso A: Estoy escribiendo en "Monto (Bs)"
    if (name === 'monto') {
        // Calculamos Ref ($) = Bs / Tasa
        const nuevaRef = formData.tasa > 0 ? valorNumerico / formData.tasa : 0;
        setFormData(prev => ({
            ...prev,
            monto: valorNumerico, // Guardo lo que escribo
            monto_calculado: parseFloat(nuevaRef.toFixed(2)) // Auto-relleno el otro
        }));
    } 
    // Caso B: Estoy escribiendo en "Ref ($)"
    else if (name === 'monto_calculado') {
        // Calculamos Monto (Bs) = Ref * Tasa
        const nuevosBs = valorNumerico * formData.tasa;
        setFormData(prev => ({
            ...prev,
            monto_calculado: valorNumerico, // Guardo lo que escribo
            monto: parseFloat(nuevosBs.toFixed(2)) // Auto-relleno el otro
        }));
    }
    // Caso C: Estoy escribiendo en "Tasa" (Manual)
    else if (name === 'tasa') {
        // Si cambio la tasa, mantengo Bs fijos y actualizo Ref ($)
        const nuevaRef = valorNumerico > 0 ? formData.monto / valorNumerico : 0;
        setFormData(prev => ({
            ...prev,
            tasa: valorNumerico,
            monto_calculado: parseFloat(nuevaRef.toFixed(2))
        }));
    }
  };

  const handleChange = (e: { target: { name: string; value: any } }) => {
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
    const estadoPago = accionBoton === 'pagar' ? 1 : 0;
    console.log(`Enviando... Acción: ${accionBoton}, Estado: ${estadoPago}`);
    console.log("Datos:", formData);
  };

  if (!isOpen) return null;

  const inputClass = "w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all";
  const labelClass = "text-[10px] font-bold text-slate-400 uppercase ml-1";

  const renderCamposManuales = () => {
     switch (formData.tipo_pago) {
        case TIPOS_PAGO.EFECTIVO:
            return (
                <div className="space-y-1 md:col-span-3">
                    <label className={labelClass}>Nombre del Beneficiario</label>
                    <input name="beneficiario_nombre" value={formData.beneficiario_nombre} onChange={handleChange} className={inputClass} placeholder="Quien retira el efectivo..." />
                <div className="space-y-1 "><label className={labelClass}>Concepto</label><input name="concepto" value={formData.concepto} onChange={handleChange} className={inputClass} /></div>
                </div>
            );
        case TIPOS_PAGO.ZELLE:
            return (
                <>
                <div className="space-y-1 md:col-span-2"><label className={labelClass}>Correo Zelle</label><input name="beneficiario_email" onChange={handleChange} className={inputClass} /></div>
                <div className="space-y-1"><label className={labelClass}>Titular</label><input name="beneficiario_nombre" onChange={handleChange} className={inputClass} /></div>
                 <div className="space-y-1"><label className={labelClass}>Concepto</label><input name="concepto" value={formData.concepto} onChange={handleChange} className={inputClass} /></div>
                </>
            );
        case TIPOS_PAGO.BINANCE:
            return (
              <>
                <div className="space-y-1 md:col-span-2"><label className={labelClass}>Binance ID / Email</label><input name="beneficiario_email" value={formData.beneficiario_email} onChange={handleChange} className={inputClass} placeholder="ID o Correo" /></div>
                 <div className="space-y-1"><label className={labelClass}>Nombre Usuario</label><input name="beneficiario_nombre" value={formData.beneficiario_nombre} onChange={handleChange} className={inputClass} /></div>
                  <div className="space-y-1"><label className={labelClass}>Concepto</label><input name="concepto" value={formData.concepto} onChange={handleChange} className={inputClass} /></div> 
              </>
            );
        case TIPOS_PAGO.PAGO_MOVIL:
            return (
                <>
                <div className="space-y-1"><label className={labelClass}>Banco</label><InputBancosAutocomplete name="beneficiario_banco" value={formData.beneficiario_banco} onChange={handleChange} className={inputClass} /></div>
                <div className="space-y-1"><label className={labelClass}>Cédula/RIF</label><input name="beneficiario_rif" onChange={handleChange} className={inputClass} /></div>
                <div className="space-y-1"><label className={labelClass}>Teléfono</label><input name="beneficiario_telefono" onChange={handleChange} className={inputClass} /></div>
                 <div className="space-y-1"><label className={labelClass}>Concepto</label><input name="concepto" value={formData.concepto} onChange={handleChange} className={inputClass} /></div> 
                </>
            );
        case TIPOS_PAGO.TRANSFERENCIA:
            return (
                <>
                <div className="space-y-1 md:col-span-2"><label className={labelClass}>Beneficiario</label><input name="beneficiario_nombre" onChange={handleChange} className={inputClass} /></div>
                <div className="space-y-1"><label className={labelClass}>RIF</label><input name="beneficiario_rif" onChange={handleChange} className={inputClass} /></div>
                <div className="space-y-1"><label className={labelClass}>Banco</label><InputBancosAutocomplete name="beneficiario_banco" value={formData.beneficiario_banco} onChange={handleChange} className={inputClass} /></div>
                <div className="space-y-1 md:col-span-2"><label className={labelClass}>Nro Cuenta</label><input name="beneficiario_cuenta" maxLength={20} onChange={handleChange} className={inputClass} /></div>
                 <div className="space-y-1"><label className={labelClass}>Concepto</label><input name="concepto" value={formData.concepto} onChange={handleChange} className={inputClass} /></div> 
                </>
            );
        default: return <div className="md:col-span-3 text-center text-xs text-slate-400 py-4">Seleccione tipo de pago</div>;
     }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-200">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
            <h3 className="text-xl font-black text-slate-800">Nueva <span className="text-red-700">Solicitud</span></h3>
            <button onClick={onClose} className="text-slate-400 hover:text-red-700 font-bold">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Slider Modo */}
            <div className="md:col-span-3 flex justify-center mb-4">
                <div className="bg-slate-100 p-0.5 rounded-lg inline-flex shadow-inner">
                    <button type="button" onClick={() => setModoBeneficiario('nuevo')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${modoBeneficiario === 'nuevo' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>+ Nuevo Beneficiario</button>
                    <button type="button" onClick={() => setModoBeneficiario('registrado')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${modoBeneficiario === 'registrado' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Buscar Registrado</button>
                </div>
            </div>

            {/* Campos Comunes */}
            <div className="space-y-1"><label className={labelClass}>Solicitante </label><input name="solicitante" value={formData.solicitante} onChange={handleChange} required className={inputClass} disabled/></div>
           
            

            {/* Área Dinámica */}
            <div className="md:col-span-3 border-t border-slate-100 mt-2 pt-4 bg-slate-50/50 p-4 rounded-lg">
                {modoBeneficiario === 'registrado' ? (
                    <div className="grid grid-cols-1">
                         <label className="text-sm font-bold text-slate-700 mb-2">Buscar en Directorio</label>
                         <select name="beneficiario_id_seleccionado" className={inputClass} onChange={handleChange}><option value="">Seleccione...</option></select>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-slate-700">Datos del Nuevo Beneficiario</h4>
                            {formData.tipo_pago !== TIPOS_PAGO.EFECTIVO && (
                                <label className="flex items-center cursor-pointer select-none">
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only" checked={guardarBeneficiario} onChange={(e) => setGuardarBeneficiario(e.target.checked)} />
                                        <div className={`block w-10 h-6 rounded-full transition-colors ${guardarBeneficiario ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${guardarBeneficiario ? 'transform translate-x-4' : ''}`}></div>
                                    </div>
                                    <div className="ml-3 text-xs font-bold text-slate-600">{guardarBeneficiario ? 'Guardar en Directorio' : 'No guardar'}</div>
                                </label>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">
                            <div className="space-y-1"><label className={labelClass}>Tipo de Pago</label><SelectorTiposPago name="tipo_pago" value={formData.tipo_pago} onChange={handleChange} className={inputClass} labelKey="nombre" valueKey="nombre" allowedOptions={LISTA_OPCIONES_PERMITIDAS} /></div>
                            {renderCamposManuales()}
                        </div>
                    </>
                )}
            </div>

            {/* Finanzas */}
            <div className="md:col-span-3 border-t border-slate-100 mt-0.5 pt-1">
                <div className="flex justify-between items-end mb-0.5">
                    <h4 className="text-sm font-bold text-slate-700">Detalles Financieros</h4>
                    {/* AJUSTE 1: Selector sin Euro */}
                    <div className="flex space-x-1 bg-slate-100 p-1 rounded-md">
                        {(['Bolivares', 'Dolar'] as const).map((m) => {
                             const code = m === 'Bolivares' ? 'VES' : 'USD';
                             return <button key={code} type="button" onClick={() => setMoneda(code)} className={`px-3 py-1 text-[10px] font-bold rounded uppercase transition-colors ${moneda === code ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>{m}</button>;
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* MONTO PRINCIPAL (Bs o USD) */}
                    <div className="space-y-1">
                        <label className={labelClass}>Monto ({moneda === 'VES' ? 'Bolívares' : 'USD'})</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                step="0.01" 
                                name="monto" // Campo Principal
                                value={formData.monto} 
                                // AJUSTE 4: Usamos el handler financiero especial
                                onChange={moneda === 'VES' ? handleFinancialChange : handleChange} 
                                required 
                                className={`${inputClass} pl-8 font-mono font-bold text-slate-700`} 
                            />
                            <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">{moneda === 'USD' ? '$' : 'Bs'}</span>
                        </div>
                    </div>
                    
                    {/* AJUSTE 2: OCULTAR TASA Y CALCULADO SI ES DÓLAR */}
                    {moneda === 'VES' && (
                        <>
                            <div className="space-y-1">
                                <label className={labelClass}>Tasa de Cambio</label>
                                <div className="flex">
                                    <select value={origenTasa} onChange={(e) => setOrigenTasa(e.target.value as any)} className="bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 rounded-l-lg px-2 outline-none focus:bg-white hover:bg-slate-200 transition-colors cursor-pointer">
                                        <option value="BCV">BCV</option>
                                        <option value="EURO">EUR</option>
                                        <option value="MANUAL">Manual</option>
                                    </select>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        name="tasa" 
                                        value={formData.tasa} 
                                        // AJUSTE 4: Handler especial también para tasa
                                        onChange={handleFinancialChange} 
                                        readOnly={origenTasa !== 'MANUAL'} 
                                        className={`w-full p-2.5 border border-l-0 border-slate-200 rounded-r-lg text-sm outline-none transition-all ${origenTasa !== 'MANUAL' ? 'bg-slate-50 text-slate-500' : 'bg-white text-slate-800 focus:ring-2 focus:ring-red-700'}`} 
                                    />
                                </div>
                                {origenTasa === 'BCV' && <p className="text-[10px] text-slate-400 mt-0.5 ml-1">Tasa oficial del día: {tasaBCV}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className={labelClass}>Ref. en Divisa ($)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        name="monto_calculado" // Campo Secundario (Dólares)
                                        value={formData.monto_calculado} 
                                        // AJUSTE 3: Desbloqueado y con lógica inversa
                                        onChange={handleFinancialChange} 
                                        className={`${inputClass} pl-8 bg-white text-slate-700 border-dashed`} 
                                    />
                                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">$</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Footer y Botones */}
            <div className="md:col-span-3 flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-50">Cancelar</button>
                
                <button 
                    type="submit" 
                    onClick={() => setAccionBoton('guardar')}
                    className="bg-red-700 text-white px-8 py-2 rounded-lg font-bold hover:bg-red-800 shadow-lg shadow-red-100 active:scale-95"
                >
                    Guardar Solicitud
                </button>

                {formData.tipo_pago === TIPOS_PAGO.EFECTIVO && (
                    <button 
                        type="submit" 
                        onClick={() => setAccionBoton('pagar')}
                        className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-100 active:scale-95 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                        Pagar Ahora
                    </button>
                )}
            </div>
        </form>
      </div>
    </div>
  );
};

export default ModalSolicitudPago;