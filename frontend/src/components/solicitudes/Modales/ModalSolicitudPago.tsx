import React, { useState, useEffect } from 'react';
import InputBancosAutocomplete from '../SelectSolicitudes/InputBancosAutocomplete';
import {useAuth} from '../../../context/AuthContext';
import SelectorTiposPago from '../SelectSolicitudes/SelectorTipoPago';
import InputBeneficiarioAutocomplete from '../SelectSolicitudes/InputBeneficiarioAutocomplete';
import { buildApiUrl } from '../../../config/api';
const TIPOS_PAGO = {
  BINANCE: "BINANCE",
  TRANSFERENCIA: "TRANSFERENCIA",
  PAGO_MOVIL: "PAGO MOVIL",
  ZELLE: "ZELLE",
  EFECTIVO: "EFECTIVO USD"
};
const LISTA_OPCIONES_PERMITIDAS = Object.values(TIPOS_PAGO);

const PREFIJOS_RIF = ['V', 'E', 'J', 'G', 'C', 'R'];

interface ModalSolicitudPagoProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: any, estadoPago?: number, soloRegistro?: boolean) => void;
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
  
  const [loading, setLoading] = useState(false);
  const [modoBeneficiario, setModoBeneficiario] = useState<'nuevo' | 'registrado' | 'solo_registro'>('nuevo');
  const [guardarBeneficiario, setGuardarBeneficiario] = useState(false);
  
  // NUEVO ESTADO: Para el switch "Agregar a Existente"
  const [agregarAExistente, setAgregarAExistente] = useState(false);

  const [moneda, setMoneda] = useState<'USD' | 'VES'>('USD');
  const [origenTasa, setOrigenTasa] = useState<'BCV' | 'EURO' | 'MANUAL'>('BCV');
  const [accionBoton, setAccionBoton] = useState<'guardar' | 'pagar'>('guardar');

  const [rifPrefijo, setRifPrefijo] = useState('V');
  const [rifNumero, setRifNumero] = useState('');

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
    monto_calculado: 0,
    referencia: '',
    banco_origen: '',
    comprobante: null as File | null
  });

  // Limpiar formulario al cambiar de pestaña
  useEffect(() => {
    // Resetear estados visuales
    setAgregarAExistente(false);
    setRifPrefijo('V');
    setRifNumero('');
    
    setFormData(prev => ({
        ...prev,
        beneficiario_id_seleccionado: '',
        beneficiario_nombre: '',
        beneficiario_rif: '',
        beneficiario_banco: '',
        beneficiario_telefono: '',
        beneficiario_cuenta: '',
        beneficiario_email: '',
        tipo_pago: '', // Opcional: reiniciar tipo de pago también
        monto: 0,
        concepto: ''
    }));
  }, [modoBeneficiario]);

  // Sincronizar RIF
  useEffect(() => {
    const rifCompleto = rifNumero ? `${rifPrefijo}-${rifNumero}` : '';
    setFormData(prev => ({ ...prev, beneficiario_rif: rifCompleto }));
  }, [rifPrefijo, rifNumero]);

  // Efecto Tasa
  useEffect(() => {
    let nuevaTasa = formData.tasa;
    if (origenTasa === 'BCV') nuevaTasa = tasaBCV;
    else if (origenTasa === 'EURO') nuevaTasa = tasaEuro;

    if (origenTasa !== 'MANUAL' && moneda === 'VES') {
        const refDolares = nuevaTasa > 0 ? (formData.monto / nuevaTasa) : 0;
        setFormData(prev => ({ 
            ...prev, 
            tasa: nuevaTasa,
            monto_calculado: parseFloat(refDolares.toFixed(2))
        }));
    } else {
        setFormData(prev => ({ ...prev, tasa: nuevaTasa }));
    }
  }, [origenTasa, tasaBCV, tasaEuro, moneda]);

  // --- LÓGICA MAESTRA DE SELECCIÓN ---
  const handleBeneficiarioSeleccionado = (item: any) => {
      // 1. Parsear RIF
      let p = 'V';
      let n = '';
      if (item.rif && item.rif.includes('-')) {
          const partes = item.rif.split('-');
          if (PREFIJOS_RIF.includes(partes[0])) {
              p = partes[0];
              n = partes[1];
          } else { n = item.rif; }
      } else { n = item.rif || ''; }
      
      setRifPrefijo(p);
      setRifNumero(n);

      // 2. Lógica Diferenciada
      if (modoBeneficiario === 'solo_registro' && agregarAExistente) {
          // CASO A: Agregar cuenta a persona existente
          // Solo rellenamos IDENTIDAD (Nombre y RIF)
          // Dejamos vacíos los datos bancarios para que el usuario los llene
          setFormData(prev => ({
              ...prev,
              beneficiario_id_seleccionado: item.beneficiario_id,
              beneficiario_nombre: item.nombre,
              beneficiario_rif: item.rif,
              // Limpiamos datos bancarios explícitamente
              beneficiario_banco: '',
              beneficiario_email: '',
              beneficiario_telefono: '',
              beneficiario_cuenta: '',
              // Mantenemos el tipo de pago que el usuario eligió en el selector
          }));

      } else {
          // CASO B: "Buscar Registrado" (Pagar a cuenta existente)
          // Rellenamos TODO (Identidad + Banco)
          let email = '';
          let telefono = '';
          let cuenta = '';

          if (item.tipo_pago === 'ZELLE' || item.tipo_pago === 'BINANCE') {
              email = item.identificador;
          } else if (item.tipo_pago === 'PAGO MOVIL') {
              telefono = item.identificador;
          } else if (item.tipo_pago === 'TRANSFERENCIA') {
              cuenta = item.identificador;
          }

          setFormData(prev => ({
              ...prev,
              beneficiario_id_seleccionado: item.beneficiario_id,
              beneficiario_nombre: item.nombre,
              beneficiario_rif: item.rif,
              tipo_pago: item.tipo_pago, // El tipo viene del registro guardado
              beneficiario_banco: item.banco || '',
              beneficiario_email: email,
              beneficiario_telefono: telefono,
              beneficiario_cuenta: cuenta,
              concepto: prev.concepto 
          }));
      }
  };

  const handleFinancialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const valorNumerico = parseFloat(value) || 0;

    if (name === 'monto') {
        const nuevaRef = formData.tasa > 0 ? valorNumerico / formData.tasa : 0;
        setFormData(prev => ({
            ...prev,
            monto: valorNumerico,
            monto_calculado: parseFloat(nuevaRef.toFixed(2))
        }));
    } 
    else if (name === 'monto_calculado') {
        const nuevosBs = valorNumerico * formData.tasa;
        setFormData(prev => ({
            ...prev,
            monto_calculado: valorNumerico,
            monto: parseFloat(nuevosBs.toFixed(2))
        }));
    }
    else if (name === 'tasa') {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modoBeneficiario === 'registrado' && !formData.beneficiario_id_seleccionado) {
        alert("Por favor, busca y selecciona un beneficiario del directorio antes de guardar.");
        return;
    }
    
    if ((modoBeneficiario === 'solo_registro' || modoBeneficiario === 'nuevo') && !formData.beneficiario_nombre) {
        alert("El nombre del beneficiario es obligatorio.");
        return;
    }

    setLoading(true);

    const payload = {
        modo_beneficiario: modoBeneficiario, 
        guardar_en_directorio: guardarBeneficiario,
        beneficiario_nombre: formData.beneficiario_nombre,
        beneficiario_rif: formData.beneficiario_rif, 
        beneficiario_email: formData.beneficiario_email,
        beneficiario_telefono: formData.beneficiario_telefono,
        beneficiario_cuenta: formData.beneficiario_cuenta,
        beneficiario_banco: formData.beneficiario_banco,
        tipo_pago: formData.tipo_pago,
        solicitante: formData.solicitante,
        empresa_id: empresaId,
        concepto: formData.concepto,
        monto: formData.monto,
        moneda: moneda, 
        tasa: formData.tasa,
        estado_pago: accionBoton === 'pagar' ? 1 : 0,
        referencia: formData.referencia,
        banco_origen: formData.banco_origen
    };

    try {
        const response = await fetch(buildApiUrl('/solicitudes/crear'), { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message || 'Operación exitosa');
            if (onSave) onSave(formData, payload.estado_pago, modoBeneficiario === 'solo_registro');
            onClose();
        } else {
            alert(`Error: ${data.message || 'No se pudo procesar la solicitud'}`);
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        alert("Error de conexión con el servidor");
    } finally {
        setLoading(false);
    }
  };

  // --- DETERMINAR SI BLOQUEAR CAMPOS DE IDENTIDAD ---
  // Bloqueamos Nombre y RIF si:
  // 1. Estamos en modo "Registrado" (siempre)
  // 2. Estamos en modo "Agregar Beneficiario" Y tenemos activado "Agregar a Existente" Y ya seleccionamos a alguien
  const camposIdentidadBloqueados = (modoBeneficiario === 'registrado') || 
                                    (modoBeneficiario === 'solo_registro' && agregarAExistente && !!formData.beneficiario_id_seleccionado);

  if (!isOpen) return null;

  const inputClass = "w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all";
  const labelClass = "text-[10px] font-bold text-slate-400 uppercase ml-1";

  // Helper Inputs
  const renderRifInput = () => (
      <div className="space-y-1">
          <label className={labelClass}>Cédula/RIF</label>
          <div className="flex">
              <select
                  value={rifPrefijo}
                  onChange={(e) => setRifPrefijo(e.target.value)}
                  disabled={camposIdentidadBloqueados} // APLICAMOS BLOQUEO
                  className={`border border-slate-200 text-sm font-bold text-slate-700 rounded-l-lg px-2 outline-none transition-colors cursor-pointer w-16 text-center appearance-none ${camposIdentidadBloqueados ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-100 focus:bg-white focus:ring-2 focus:ring-red-700'}`}
              >
                  {PREFIJOS_RIF.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input
                  value={rifNumero}
                  onChange={(e) => setRifNumero(e.target.value)}
                  disabled={camposIdentidadBloqueados} // APLICAMOS BLOQUEO
                  className={`w-full p-2.5 border border-l-0 border-slate-200 rounded-r-lg text-sm outline-none transition-all font-mono ${camposIdentidadBloqueados ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-red-700'}`}
                  placeholder="12345678"
                  maxLength={12} 
              />
          </div>
      </div>
  );

  const renderConceptoInput = () => {
      if (modoBeneficiario === 'solo_registro') return null;
      return (
          <div className="space-y-1">
              <label className={labelClass}>Concepto / Nota</label>
              <input name="concepto" value={formData.concepto} onChange={handleChange} className={inputClass} />
          </div>
      );
  };

  const renderCamposManuales = () => {
     // Clase condicional para input de Nombre Bloqueado
     const nombreInputClass = camposIdentidadBloqueados 
        ? "w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed outline-none"
        : inputClass;

     switch (formData.tipo_pago) {
        case TIPOS_PAGO.EFECTIVO:
            return (
                <div className="space-y-1 md:col-span-3">
                    <label className={labelClass}>Nombre del Beneficiario</label>
                    <input name="beneficiario_nombre" value={formData.beneficiario_nombre} onChange={handleChange} disabled={camposIdentidadBloqueados} className={nombreInputClass} placeholder="Quien retira el efectivo..." />
                    {renderConceptoInput()}
                </div>
            );
        case TIPOS_PAGO.ZELLE:
            return (
                <>
                <div className="space-y-1 md:col-span-2"><label className={labelClass}>Correo Zelle</label><input name="beneficiario_email" value={formData.beneficiario_email} onChange={handleChange} className={inputClass} /></div>
                <div className="space-y-1"><label className={labelClass}>Titular (Beneficiario)</label><input name="beneficiario_nombre" value={formData.beneficiario_nombre} onChange={handleChange} disabled={camposIdentidadBloqueados} className={nombreInputClass} /></div>
                {renderConceptoInput()}
                </>
            );
        case TIPOS_PAGO.BINANCE:
            return (
              <>
                <div className="space-y-1 md:col-span-2"><label className={labelClass}>Binance ID / Email</label><input name="beneficiario_email" value={formData.beneficiario_email} onChange={handleChange} className={inputClass} placeholder="ID o Correo" /></div>
                 <div className="space-y-1"><label className={labelClass}>Nombre Usuario</label><input name="beneficiario_nombre" value={formData.beneficiario_nombre} onChange={handleChange} disabled={camposIdentidadBloqueados} className={nombreInputClass} /></div>
                 {renderConceptoInput()}
              </>
            );
        case TIPOS_PAGO.PAGO_MOVIL:
            return (
                <>
                <div className="space-y-1 md:col-span-2"><label className={labelClass}>Nombre del Beneficiario</label><input name="beneficiario_nombre" value={formData.beneficiario_nombre} onChange={handleChange} disabled={camposIdentidadBloqueados} className={nombreInputClass} /></div>
                <div className="space-y-1"><label className={labelClass}>Banco</label><InputBancosAutocomplete name="beneficiario_banco" value={formData.beneficiario_banco} onChange={handleChange} className={inputClass} /></div>
                {renderRifInput()}
                <div className="space-y-1"><label className={labelClass}>Teléfono</label><input name="beneficiario_telefono" value={formData.beneficiario_telefono} onChange={handleChange} className={inputClass} /></div>
                {renderConceptoInput()}
                </>
            );
        case TIPOS_PAGO.TRANSFERENCIA:
            return (
                <>
                <div className="space-y-1 md:col-span-2"><label className={labelClass}>Nombre del Beneficiario</label><input name="beneficiario_nombre" value={formData.beneficiario_nombre} onChange={handleChange} disabled={camposIdentidadBloqueados} className={nombreInputClass} /></div>
                {renderRifInput()}
                <div className="space-y-1"><label className={labelClass}>Banco</label><InputBancosAutocomplete name="beneficiario_banco" value={formData.beneficiario_banco} onChange={handleChange} className={inputClass} /></div>
                <div className="space-y-1 md:col-span-2"><label className={labelClass}>Nro Cuenta</label><input name="beneficiario_cuenta" value={formData.beneficiario_cuenta} maxLength={20} onChange={handleChange} className={inputClass} /></div>
                {renderConceptoInput()}
                </>
            );
        default: return <div className="md:col-span-3 text-center text-xs text-slate-400 py-4">Seleccione tipo de cuenta</div>;
     }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-200">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
            <h3 className="text-xl font-black text-slate-800">
                {modoBeneficiario === 'solo_registro' ? 'Agregar ' : 'Nueva '} 
                <span className="text-red-700">
                    {modoBeneficiario === 'solo_registro' ? 'Beneficiario' : 'Solicitud'}
                </span>
            </h3>
            <button onClick={onClose} disabled={loading} className="text-slate-400 hover:text-red-700 font-bold disabled:opacity-50">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Slider Modo */}
            <div className="md:col-span-3 flex justify-center mb-4">
                <div className={`bg-slate-100 p-0.5 rounded-lg inline-flex shadow-inner ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <button type="button" onClick={() => setModoBeneficiario('nuevo')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${modoBeneficiario === 'nuevo' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>+ Nuevo Pago</button>
                    <button type="button" onClick={() => setModoBeneficiario('registrado')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${modoBeneficiario === 'registrado' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Buscar Registrado</button>
                    <button type="button" onClick={() => setModoBeneficiario('solo_registro')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${modoBeneficiario === 'solo_registro' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Agregar Beneficiario</button>
                </div>
            </div>

            {/* Campos Comunes */}
            <div className="space-y-1"><label className={labelClass}>Solicitante </label><input name="solicitante" value={formData.solicitante} onChange={handleChange} required className={inputClass} disabled/></div>
            
            {/* Área Dinámica */}
            <div className="md:col-span-3 border-t border-slate-100 mt-2 pt-4 bg-slate-50/50 p-4 rounded-lg">
                {modoBeneficiario === 'registrado' ? (
                    <div className="flex flex-col gap-4">
                         <div>
                             <label className="text-sm font-bold text-slate-700 mb-2 block">Buscar en Directorio</label>
                             <InputBeneficiarioAutocomplete 
                                onSelect={handleBeneficiarioSeleccionado}
                                disabled={loading}
                                className="w-full"
                             />
                         </div>

                         {formData.beneficiario_id_seleccionado && (
                            <div className="animate-fade-in-down">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-px bg-slate-200 flex-1"></div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Datos Cargados</span>
                                    <div className="h-px bg-slate-200 flex-1"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <div className="space-y-1">
                                        <label className={labelClass}>Tipo de Cuenta</label>
                                        <SelectorTiposPago 
                                            name="tipo_pago" 
                                            value={formData.tipo_pago} 
                                            onChange={handleChange} 
                                            className={`${inputClass} bg-slate-100`}
                                            labelKey="nombre" 
                                            valueKey="nombre" 
                                            allowedOptions={LISTA_OPCIONES_PERMITIDAS} 
                                        />
                                    </div>
                                    {renderCamposManuales()}
                                </div>
                            </div>
                         )}
                    </div>
                ) : (
                    <>
                        {/* Header de la sección de registro */}
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-slate-700">
                                {modoBeneficiario === 'solo_registro' ? 'Datos para el Directorio' : 'Datos del Nuevo Beneficiario'}
                            </h4>
                            
                            {/* Toggle Switch para Agregar a Existente (Solo en modo registro) */}
                            {modoBeneficiario === 'solo_registro' && (
                                <label className="flex items-center cursor-pointer select-none mr-2">
                                    <div className="relative">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only" 
                                            checked={agregarAExistente} 
                                            onChange={(e) => {
                                                setAgregarAExistente(e.target.checked);
                                                // Resetear selección al cambiar
                                                if(!e.target.checked) {
                                                    setFormData(prev => ({...prev, beneficiario_nombre: '', beneficiario_rif: '', beneficiario_id_seleccionado: ''}));
                                                    setRifPrefijo('V'); setRifNumero('');
                                                }
                                            }} 
                                            disabled={loading} 
                                        />
                                        <div className={`block w-9 h-5 rounded-full transition-colors ${agregarAExistente ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${agregarAExistente ? 'transform translate-x-4' : ''}`}></div>
                                    </div>
                                    <div className="ml-2 text-xs font-bold text-slate-600">Agregar a Existente</div>
                                </label>
                            )}
                            
                            {/* Checkbox "Guardar en directorio" (Solo en modo Nuevo Pago) */}
                            {modoBeneficiario !== 'solo_registro' && formData.tipo_pago !== TIPOS_PAGO.EFECTIVO && (
                                <label className="flex items-center cursor-pointer select-none">
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only" checked={guardarBeneficiario} onChange={(e) => setGuardarBeneficiario(e.target.checked)} disabled={loading} />
                                        <div className={`block w-10 h-6 rounded-full transition-colors ${guardarBeneficiario ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${guardarBeneficiario ? 'transform translate-x-4' : ''}`}></div>
                                    </div>
                                    <div className="ml-3 text-xs font-bold text-slate-600">{guardarBeneficiario ? 'Guardar' : 'No guardar'}</div>
                                </label>
                            )}
                        </div>

                        {/* BUSCADOR: Solo visible si "Agregar a Existente" está activo */}
                        {modoBeneficiario === 'solo_registro' && agregarAExistente && (
                            <div className="mb-4 animate-fade-in-down">
                                <InputBeneficiarioAutocomplete 
                                    onSelect={handleBeneficiarioSeleccionado}
                                    disabled={loading}
                                    className="w-full border-2 border-blue-100 rounded-lg"
                                />
                                <p className="text-[10px] text-blue-500 mt-1 ml-1">* Busque al beneficiario para agregarle una cuenta nueva.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">
                            <div className="space-y-1"><label className={labelClass}>Tipo de Cuenta</label><SelectorTiposPago name="tipo_pago" value={formData.tipo_pago} onChange={handleChange} className={inputClass} labelKey="nombre" valueKey="nombre" allowedOptions={LISTA_OPCIONES_PERMITIDAS} /></div>
                            {renderCamposManuales()}
                        </div>
                    </>
                )}
            </div>

            {/* Finanzas */}
            {modoBeneficiario !== 'solo_registro' && (
                <div className="md:col-span-3 border-t border-slate-100 mt-0.5 pt-1">
                    <div className="flex justify-between items-end mb-0.5">
                        <h4 className="text-sm font-bold text-slate-700">Detalles Financieros</h4>
                        <div className="flex space-x-1 bg-slate-100 p-1 rounded-md">
                            {(['Bolivares', 'Dolar'] as const).map((m) => {
                                 const code = m === 'Bolivares' ? 'VES' : 'USD';
                                 return <button key={code} type="button" onClick={() => setMoneda(code)} className={`px-3 py-1 text-[10px] font-bold rounded uppercase transition-colors ${moneda === code ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>{m}</button>;
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1">
                            <label className={labelClass}>Monto ({moneda === 'VES' ? 'Bolívares' : 'USD'})</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    name="monto" 
                                    // CAMBIO AQUÍ: Agregamos || '' para que oculte el 0
                                    value={formData.monto || ''} 
                                    onChange={moneda === 'VES' ? handleFinancialChange : handleChange} 
                                    required={modoBeneficiario !== 'solo_registro'}
                                    className={`${inputClass} pl-8 font-mono font-bold text-slate-700`} 
                                />
                                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">{moneda === 'USD' ? '$' : 'Bs'}</span>
                            </div>
                        </div>
                        
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
                                            // CAMBIO AQUÍ
                                            value={formData.tasa || ''} 
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
                                            name="monto_calculado" 
                                            // CAMBIO AQUÍ
                                            value={formData.monto_calculado || ''} 
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
            )}

            {/* Footer y Botones */}
            <div className="md:col-span-3 flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={onClose} disabled={loading} className="px-6 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-50">Cancelar</button>
                
                <button 
                    type="submit" 
                    onClick={() => setAccionBoton('guardar')}
                    disabled={loading}
                    className={`bg-red-700 text-white px-8 py-2 rounded-lg font-bold hover:bg-red-800 shadow-lg shadow-red-100 active:scale-95 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {loading ? 'Procesando...' : (modoBeneficiario === 'solo_registro' ? 'Guardar Beneficiario' : 'Guardar Solicitud')}
                </button>

                {modoBeneficiario !== 'solo_registro' && formData.tipo_pago === TIPOS_PAGO.EFECTIVO && (
                    <button 
                        type="submit" 
                        onClick={() => setAccionBoton('pagar')}
                        disabled={loading}
                        className={`bg-green-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-100 active:scale-95 flex items-center gap-2 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {!loading && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a1 1 0 11-2 0 1 1 0 012 0z" /></svg>}
                        {loading ? 'Pagando...' : 'Pagar Ahora'}
                    </button>
                )}
            </div>
        </form>
      </div>
    </div>
  );
};

export default ModalSolicitudPago;