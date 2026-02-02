"use client"

// Arqueo.tsx
import React, { useEffect, useState, useMemo } from 'react';
import Select from 'react-select';
import { useParams } from 'react-router-dom';
import { useAuth } from "../../../context/AuthContext"
import axios from 'axios';
import { buildApiUrl } from '../../../config/api';
interface Params {
    [key: string]: string | undefined; // Add index signature
    date?: string; //date?: "2025-01-01";
    empresaId: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface TipoPago {
  id: number;
  nombre: string;
  is_efectivo: number | boolean;
  is_moneda_nacional: number | boolean;
  is_moneda_extranjera: number | boolean;
  is_aplicar_gastos: number | boolean;
  codtipomoneda_siace: number;
  nombre_corto: string;
  
}
interface TipoSumatoriaModosPagoAsesor {
  codusua:number;
  usuario:string;
  monto:number;
  codpago:number;
  tipo:string;
}

interface ObservacionGeneralCuadreRow {
  id: number;
  observacion: string;
  usuario: string;
  created_at: string;
}
const Arqueo: React.FC = () => {
    const [error, setError] = useState<string | null>(null);
    const { date } = useParams<Params>();
    const { empresaActual,usuario } = useAuth()
    const[asesores, setAsesores]= useState([]);
    const[tiposPago, setTiposPago]= useState<TipoPago[]>([]);
    const[montos, setMontos]= useState<Record<number, number>>({})
    const[selectedAsesor, setSelectedAsesor]= useState<string | null>(null)    
    const[tasaHoy, setTasaHoy]= useState<number>(0.00)    
    const[conceptos, setConceptos]= useState<any[]>([])
    const[egresos, setEgresos]= useState<any[]>([])
    const[gastoForm, setGastoForm]= useState<{ contConcepto: string; descripcion: string; tipoPagoId: number; debito: number }>({ contConcepto: '', descripcion: '', tipoPagoId: 0, debito: 0 })
    // modal/denominaciones
    const[openModal, setOpenModal]= useState(false)
    const[activeTipoPago, setActiveTipoPago]= useState<TipoPago | null>(null)
    const[denominaciones, setDenominaciones]= useState<any[]>([])
    const[denomCantidades, setDenomCantidades]= useState<Record<number, number>>({})
    const[cuadreDetallado, setCuadreDetallado]= useState<any[]>([])
    const[listaArqueosCerrados, setListaArqueosCerrados]= useState<any[]>([])
    const[sumatoriaModosPagoAsesor, setSumatoriaModosPagoAsesor]= useState<TipoSumatoriaModosPagoAsesor[]>([])
    const[observacion, setObservacion]= useState<string>('')
    const[observacionesAsesor, setObservacionesAsesor]= useState<ObservacionGeneralCuadreRow[]>([])
    const[cargandoObservacionesAsesor, setCargandoObservacionesAsesor]= useState<boolean>(false)
    //sumatorias totales
    const totalEgresos = egresos.reduce((s, x)=> s + Number(x.debito_calculado || 0), 0)
    const sumaDivisasEfectivos = tiposPago.filter(t => t.is_efectivo).reduce((s, tipo) => {
      const tasa = tipo.is_moneda_nacional === 1 ? (tasaHoy ?? 1) : 1
      const monto = Number(montos[tipo.id] ?? 0)
      const value = tasa !== 0 ? monto / tasa : 0
      return s + value
    }, 0)
    const sumaDivisasSinEfectivo = tiposPago.filter(t => !t.is_efectivo).reduce((acc, tipo) => {
      const monto = sumatoriaModosPagoAsesor.find(r => r.codpago === tipo.codtipomoneda_siace)?.monto ?? 0;
      const tasa = tipo.is_moneda_nacional === 1 ? (tasaHoy ?? 1) : 1;
      const value = tasa !== 0 ? Number(monto) / tasa : 0;
      return acc + value;
    }, 0);
    
    const totalEfectivo = totalEgresos + sumaDivisasEfectivos
    const totalGeneral = totalEfectivo + sumaDivisasSinEfectivo

    const options = useMemo(() => {
      const seen = new Set<string>()
      return (asesores as any[]).flatMap((asesor: any) => {
        const value = String(asesor.codusua)
        if (!value || seen.has(value)) return []
        seen.add(value)

        const isCerrado = listaArqueosCerrados.some((cerrado: any) => String(cerrado.codusua) === value)
        return [
          {
            value,
            label: isCerrado ? `${asesor.usuario} (cerrado)` : asesor.usuario,
          },
        ]
      })
    }, [asesores, listaArqueosCerrados]);

    const limpiarNombreAsesor = (label: string) => label.replace(/\s*\(cerrado\)\s*$/i, '').trim()

    const usuarioAsesor = useMemo(() => {
      if (!selectedAsesor) return ''
      const opt = options.find(o => String(o.value) === String(selectedAsesor))
      return opt ? limpiarNombreAsesor(opt.label) : ''
    }, [options, selectedAsesor])

    //optenemos el valor de la tasa de cambio actual con la siguiente api
    const obtenerTasaCambioActual = async () => {
      try {
        let tasa: number;
        
        // 1. Intenta con tu API
        const localResponse = await axios.get(
          buildApiUrl(`/finanzas/cuadre-obtener-tasa-siace/${empresaActual?.id}/${date}`), 
          { withCredentials: true }
        );
        
        // Si tu API devuelve datos válidos
        if (localResponse.data && localResponse.data[0].nueva_tasa_de_cambio_en_moneda_nacional) {
         
          tasa = localResponse.data[0].nueva_tasa_de_cambio_en_moneda_nacional;
          
        } else {
          // 2. Si no, usa la API externa
          const externalResponse = await axios.get('https://ve.dolarapi.com/v1/dolares/oficial');
          tasa = externalResponse.data.promedio;
        }
        setTasaHoy(tasa);
        return tasa;
        
      } catch (err) {
        setError("No se pudo obtener la tasa de cambio actual.");
        console.log("Error al obtener tasa:", err);
        
        // Último recurso: valor por defecto
        const tasaDefault = 0.00;
        setTasaHoy(tasaDefault);
        return tasaDefault;
      }            
    }

    useEffect(()=>{
      //verificamos que exista una empresa actual seleccionada
      if (empresaActual?.id) {
        //ejecutamos la función para cargar los asesores
          manejarCargarAsesores();
          manejarCargaTipoPagoDetalle();
          manejarCargarArqueosCerrados();
      }
    }, [empresaActual?.id]);

    const manejarCargarCuadreDetallado = async ()=>{
      //buscamos la denominacion del efectivo detallado por asesor
      if (!selectedAsesor || !empresaActual?.id) {
        setCuadreDetallado([])
        return
      }
      try {
        const params = new URLSearchParams({ empresa_id: String(empresaActual.id) })
        if (date) params.append('fecha', date)
        const resp = await axios.get(buildApiUrl(`/finanzas/cuadre-efectivo-detallado/${selectedAsesor}?${params.toString()}`), { withCredentials: true })
        setCuadreDetallado(resp.data)

        // Recalcular montos desde cero: sumar `total` por `tipo_pago_id`.
        // Si la fila no trae `tipo_pago_id`, intentar mapear por `tipo_moneda_id` usando `codtipomoneda_siace`.
        const suma: Record<number, number> = {}
        resp.data.forEach((monedaDetallado:any) => {
          const total = Number(monedaDetallado.total ?? 0)
          let tipoPagoId: number | undefined = monedaDetallado.tipo_pago_id          
        
          if (tipoPagoId) suma[tipoPagoId] = (suma[tipoPagoId] ?? 0) + total
        })

        // Reemplazamos el estado de montos con la suma calculada (recalculo desde cero)
        setMontos(suma)
      } catch (error) {
        setError("No se pudo cargar el cuadre detallado.");
        console.error('error cargando cuadre detallado', error)
      }
    }

    useEffect(()=>{
      
      manejarCargarCuadreDetallado()      
      obtenerTasaCambioActual()
      cargarConceptos()
      manejarCargarEgresos()
      manejarCargarSumatoriaModosPagoAsesor()
      manejarCargarObservacionGeneral()
      manejarCargarObservacionesAsesor()
    }, [selectedAsesor, empresaActual?.id, date])
   
    const manejarCargarArqueosCerrados = async ()=>{
      try {
        const response = await axios.get(buildApiUrl(`/finanzas/cuadre-listar-arqueo-cerrado/${empresaActual?.id}/${date}`), {
          withCredentials: true,
        });
        setListaArqueosCerrados(response.data);
      } catch (error) {
        setError("No se pudo cargar los arqueos cerrados.");
        console.error("Error al obtener arqueos cerrados", error);
      }
    }

    const manejarCargarAsesores = async ()=>{
      try {
        const response = await axios.get(buildApiUrl(`/finanzas/lista-asesores/${empresaActual?.id}/${date}`), {
          withCredentials: true,
        });
        
        setAsesores(response.data);
      } catch (err) {
        setError("No se pudo cargar los asesores, error al conectar con base de datos.");
        console.error("error al obtener los asesores",err);        
      }      
    }


    const manejarCargaTipoPagoDetalle = async ()=>{
      try {
        const response = await axios.get(buildApiUrl(`/finanzas/tipos-pago-detalle`), { withCredentials: true })
        setTiposPago(response.data)
        
      } catch (error) {
        setError("No se pudo cargar los tipos de pago.");
        console.error('error cargando tipos pago detalle', error)
      }
    }

    const handleMontoChange = (id:number, value:string) => {
      const num = Number(value)
      setMontos(prev=>({ ...prev, [id]: isNaN(num) ? 0 : num }))
    }

    const manejarCargarObservacionGeneral = async () => {
      if (!empresaActual?.id || !selectedAsesor) {
        setObservacion('')
        return
      }
      try {
        const fechaParam = date ?? new Date().toISOString().slice(0,10)
        const response = await axios.get(
          buildApiUrl(`/finanzas/cuadre-arqueo-observacion/${empresaActual.id}/${fechaParam}/${selectedAsesor}`),
          { withCredentials: true }
        )
        setObservacion(response.data?.observacion ?? '')
      } catch (error) {
        setError("No se pudo cargar la observación general.");
        console.error(error)
      }
    }

    const manejarCargarObservacionesAsesor = async () => {
      if (!empresaActual?.id || !selectedAsesor) {
        setObservacionesAsesor([])
        return
      }
      setCargandoObservacionesAsesor(true)
      try {
        const fechaParam = date ?? new Date().toISOString().slice(0,10)
        const resp = await axios.get(
          buildApiUrl(`/finanzas/cuadre-arqueo-observaciones/${empresaActual.id}/${fechaParam}/${selectedAsesor}`),
          { withCredentials: true }
        )
        setObservacionesAsesor(Array.isArray(resp.data) ? resp.data : [])
      } catch (error) {
        setError("No se pudo cargar las observaciones del asesor.");
        console.error('error cargando observaciones del asesor', error)
        setObservacionesAsesor([])
      } finally {
        setCargandoObservacionesAsesor(false)
      }
    }
    

    const abrirModalDenominaciones = async (tipo:TipoPago) => {
      // Solo para modos de pago en efectivo
      if (!tipo.is_efectivo) return
      setActiveTipoPago(tipo)
      try {
        const resp = await axios.get(buildApiUrl(`/finanzas/denominaciones/${tipo.id}`), { withCredentials: true })
        setDenominaciones(resp.data)
        // inicializar cantidades en 0
        const init:any = {}
        resp.data.forEach((d:any)=> init[d.id]=0)
        setDenomCantidades(init)
        setOpenModal(true)
      } catch (error) {
        console.error('error cargando denominaciones', error)
      }
    }

    const handleDenomChange = (id:number, value:string)=>{
      const num = Number(value)
      setDenomCantidades(prev=>({ ...prev, [id]: isNaN(num) ? 0 : num }))
    }

    const guardarDenominaciones = async ()=>{
      if (!activeTipoPago) return
      if (!empresaActual?.id) return alert('Empresa no seleccionada')
      if (!selectedAsesor) return alert('Seleccione un asesor')
      if (!tasaHoy)return alert('No se puede guardar la denominacion porque no hay tasa registrada para este dia')  
      const tipo_moneda_id = activeTipoPago.is_moneda_nacional ? 1 : 3
      const items = Object.entries(denomCantidades).map(([k,v])=>({ denominacion_id: Number(k), cantidad: Number(v) }))
      try {
        await axios.post(buildApiUrl('/finanzas/cuadre-denominacion'), {
          empresa_id: empresaActual.id,
          fecha: date,
          codusua: selectedAsesor,
          usuario: usuarioAsesor,
          tipo_moneda_id,
          tipo_pago_id: activeTipoPago.id,
          usuario_id: usuario?.id,
          valor_tasa: activeTipoPago.is_moneda_nacional ? (tasaHoy ?? 1) : 1,
          items
        }, { withCredentials: true })
        // sumar el total de denominaciones y agregar al monto del tipo de pago
         let suma = 0
        for (const d of denominaciones) {
          const qty = Number(denomCantidades[d.id] ?? 0)
          const valor = Number(d.nombre) || 0
          suma += qty * valor
        }
        setMontos(prev=>({ ...prev, [activeTipoPago!.id]: (prev[activeTipoPago!.id] ?? 0) + suma })) 
        setOpenModal(false)
        
        // refrescar listado detallado
        manejarCargarCuadreDetallado()
        
      } catch (error) {
        setError("No se pudo guardar las denominaciones.");
        console.error('error guardando denominaciones', error)
      }
    }

    const cargarConceptos = async ()=>{
      //cargamos los conceptos de la base de datos del siace
      if (!empresaActual?.id) return
      try {
        const resp = await axios.get(buildApiUrl(`/finanzas/conceptos-contables/${empresaActual.id}`), { withCredentials: true })
        setConceptos(resp.data || [])
      } catch (error) {
        setError("No se pudo cargar los conceptos contables.");
        console.error('error cargando conceptos contables', error)
      }
    }

    const manejarCargarEgresos = async ()=>{
      if (!selectedAsesor || !empresaActual?.id) {
        setEgresos([])
        return
      }
      try {
        const params = new URLSearchParams({ empresa_id: String(empresaActual.id) })
        if (date) params.append('fecha', date)
        const resp = await axios.get(buildApiUrl(`/finanzas/cuadre-arqueo-egresos/${selectedAsesor}?${params.toString()}`), { withCredentials: true })
        setEgresos(resp.data || [])
      } catch (error) {
        setError("No se pudo cargar los egresos.");
        console.error('error cargando egresos', error)
      }
    }

    const manejarCargarSumatoriaModosPagoAsesor = async ()=>{
      //muscamos en la base de datos del siace la sumatoria de los modos de pago por asesor
      if (!selectedAsesor || !empresaActual?.id) {
        return
      }
      try {
        const fechaParam = date ?? new Date().toISOString().slice(0,10)
        const resp = await axios.get(buildApiUrl(`/finanzas/cuadre-movimientos-pagos-asesor/${empresaActual.id}/${fechaParam}/${selectedAsesor}`), { withCredentials: true })
        setSumatoriaModosPagoAsesor(resp.data || [])       
      } catch (error) {
        console.error('error cargando sumatoria modos pago asesor', error)
      }
    }
    
    // Aquí puedes implementar la lógica para obtener el listado de empleados
    // y el arqueo correspondiente a la fecha seleccionada.

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
  {/* Encabezado Principal */}
  <div className="mb-8">
    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Registro de Arqueo</h1>
    <p className="text-slate-500 mt-1">Gestión y control de flujo de caja diario.</p>
  </div>
  {error && (
    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-700 text-red-800 rounded-r-lg flex items-center gap-3">
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
      <p className="text-sm font-semibold">{error}</p>
    </div>
  )}
  {/* Card de Configuración */}
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-700">Arqueo de Caja</h2>
        <p className="text-sm text-slate-500">Fecha: {date} | Empresa ID: <span className="font-mono text-primary-600">{empresaActual?.id}</span></p>
      </div>
      <div className="w-full md:w-72">
        <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Seleccionar Asesor</label>
        <Select 
          styles={{
            control: (base) => ({
              ...base,
              backgroundColor: '#f8fafc', // bg-slate-50
              borderColor: '#e2e8f0',     // border-slate-200
              borderRadius: '0.5rem',     // rounded-lg
              padding: '2px',
            }),
          }}
          getOptionValue={(opt: any) => String(opt.value)}
          options={options} 
          onChange={(opt: any) => setSelectedAsesor(opt?.value ?? null)} 
          value={options.find(o => o.value === selectedAsesor) ?? null}
          className="text-sm"
        />
      </div>
    </div>
  </div>

  {/* Sección de Tipos de Pago y Cuadre */}
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
      <span className="w-1 h-8 bg-primary-600 rounded-full"></span>
      Tipos de Pago
    </h2>
    
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        
        {/* Tabla Principal de Pagos */}
        <div className="flex-1 p-6">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-xs uppercase tracking-wider">
                <th className="pb-4 font-medium">Tipo de Pago</th>
                <th className="pb-4 font-medium text-right">Monto</th>
                <th className="pb-4 font-medium text-right">En Divisa (Tasa: {tasaHoy})</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {tiposPago.map((tipo) => (
                <tr key={tipo.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="py-4 font-medium text-slate-700">{tipo.nombre}</td>
                  <td className="py-4 text-right">
                    {tipo.is_efectivo ? (
                      <div className="flex items-center justify-end gap-2">
                        <input 
                          type="number" 
                          readOnly 
                          className="w-32 bg-slate-100 border-none rounded-lg px-3 py-1.5 text-right font-semibold text-primary-700 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all" 
                          value={montos[tipo.id] ?? ''} 
                          onClick={() => abrirModalDenominaciones(tipo)} 
                        />
                        <span className="text-xs text-slate-400">{tipo.nombre_corto}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600 font-medium">
                        {sumatoriaModosPagoAsesor.find((r: any) => r.codpago === tipo.codtipomoneda_siace)?.monto ?? '0.00'}
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-right font-mono text-slate-500">
                    {(() => {
                      const tasa = tipo.is_moneda_nacional === 1 ? (tasaHoy ?? 1) : 1;
                      const monto = tipo.is_efectivo 
                        ? Number(montos[tipo.id] ?? 0) 
                        : (sumatoriaModosPagoAsesor.find((r: any) => r.codpago === tipo.codtipomoneda_siace)?.monto ?? 0);
                      const value = tasa !== 0 ? monto / tasa : 0;
                      return value > 0 ? value.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-';
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-100">
              <tr>
                <td colSpan={2} className="pt-6 text-slate-500 font-medium">Total Efectivo + Gastos</td>
                <td className="pt-6 text-right text-2xl font-bold text-green-600 font-mono">{totalEfectivo.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={2} className="py-2 text-slate-500 font-medium">Total General Arqueo</td>
                <td className="py-2 text-right text-3xl font-black text-slate-800 font-mono">{totalGeneral.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Cuadre Detallado Lateral */}
        <div className="w-full lg:w-96 bg-slate-50/50 p-6">
          <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 tracking-tight">Cuadre Efectivo Detallado</h3>
          <div className="max-h-[400px] overflow-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-slate-500 border-b border-slate-200">
                  <th className="p-2 text-left">Denom</th>
                  <th className="p-2 text-center">Cant</th>
                  <th className="p-2 text-right">Total</th>
                  <th className="p-2 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cuadreDetallado.map(row => (
                  <tr key={row.id} className="hover:bg-red-50 group">
                    <td className="p-2 font-medium">{row.abreviatura} {row.denominacion}</td>
                    <td className="p-2 text-center text-slate-500">{row.cantidad}</td>
                    <td className="p-2 text-right font-semibold">{row.total}</td>
                    <td className="p-2 text-center">
                      <button 
                        className="text-slate-300 hover:text-red-600 transition-colors p-1"
                        onClick={async () => {
                          if (!confirm('¿Eliminar registro?')) return;
                          try {
                            await axios.delete(buildApiUrl(`/finanzas/cuadre-efectivo-detallado/${row.id}`), { withCredentials: true });
                            manejarCargarCuadreDetallado();
                          } catch (error) { console.error(error); }
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Formulario de Gastos */}
  <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all focus-within:ring-1 focus-within:ring-primary-500">
    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
      <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      Registrar Nuevo Gasto
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Concepto Contable</label>
        <Select 
          options={conceptos.map(c => ({ value: String(c.keycodigo), label: c.nombre }))} 
          getOptionValue={(opt: any) => `${String(opt.value)}-${String(opt.label)}`}
          onChange={(opt: any) => setGastoForm(prev => ({ ...prev, contConcepto: opt?.value ?? '' }))} 
          value={conceptos.find(c => String(c.keycodigo) === gastoForm.contConcepto) ? { value: gastoForm.contConcepto, label: conceptos.find(c => String(c.keycodigo) === gastoForm.contConcepto)?.nombre } : null} 
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Descripción</label>
        <input 
          type="text" 
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all" 
          placeholder="Ej: Pago de flete..."
          value={gastoForm.descripcion}
          style={{ textTransform: 'uppercase' }} 
          onChange={(e) => setGastoForm(prev => ({ ...prev, descripcion: e.target.value }))} 
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Tipo Pago</label>
        <select 
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all appearance-none bg-white" 
          value={String(gastoForm.tipoPagoId)} 
          onChange={(e) => setGastoForm(prev => ({ ...prev, tipoPagoId: Number(e.target.value) }))}
        >
          <option value={0}>Seleccione tipo...</option>
          {tiposPago.filter(t => t.is_aplicar_gastos === 1).map(t => (<option key={t.id} value={t.id}>{t.nombre}</option>))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Monto Débito</label>
        <input 
          type="number" 
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all" 
          value={gastoForm.debito} 
          onChange={(e) => setGastoForm(prev => ({ ...prev, debito: Number(e.target.value) }))} 
        />
      </div>
    </div>
    <div className="mt-6 flex justify-end">
      <button 
        className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-full font-semibold text-sm transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
        onClick={async ()=>{
                if (!empresaActual?.id || !selectedAsesor) return alert('Seleccione empresa y asesor')
                if (!gastoForm.contConcepto) return alert('Seleccione un concepto')
                if (!gastoForm.tipoPagoId || gastoForm.debito <= 0) return alert('Complete tipo de pago y débito válido')
                try {
                  const tipo = tiposPago.find(tp=>tp.id === gastoForm.tipoPagoId)
                  const valor_tasa = tipo?.is_moneda_nacional === 1 ? (tasaHoy ?? 1) : 1
                  const debito_calculado = valor_tasa !== 0 ? Number((gastoForm.debito / valor_tasa).toFixed(2)) : 0
                  const conceptoObj = conceptos.find(c=>String(c.keycodigo) === String(gastoForm.contConcepto))
                  
                  const datosGastos = {
                    empresa_id: empresaActual.id,
                    codusua: selectedAsesor,
                    usuario: usuarioAsesor,
                    fecha: date ?? new Date().toISOString().slice(0,10),
                    tipo_pago_id: gastoForm.tipoPagoId,
                    valor_tasa,
                    debito: gastoForm.debito,
                    debito_calculado,
                    cont_concepto_id: gastoForm.contConcepto,
                    concepto: conceptoObj?.nombre ?? '',
                    descripcion: gastoForm.descripcion,
                    usuario_id: usuario?.id,
                  }
                  await axios.post(buildApiUrl('/finanzas/cuadre-arqueo-gasto'), datosGastos, { withCredentials: true })
                  // refrescar tablas
                  manejarCargarEgresos()
                  //manejarCargarDatosArqueoAsesor()
                  manejarCargarCuadreDetallado()
                  
                  // limpiar formulario
                  setGastoForm({ contConcepto: '', descripcion: '', tipoPagoId: 0, debito: 0 })
                } catch (error) {
                  console.error('error guardando gasto', error)
                }
              }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        Guardar Gasto
      </button>
    </div>
  </div>

  {/* Tabla de Egresos */}
  <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
    <h3 className="text-lg font-bold text-slate-600 mb-4">Historial de Egresos</h3>
    {egresos.length === 0 ? (
      <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-xl">
        <p className="text-slate-400">No hay egresos registrados hoy.</p>
      </div>
    ) : (
      <div className="overflow-hidden rounded-lg border border-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-slate-500 text-left">
              <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-widest">Concepto</th>
              <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-widest">Descripción</th>
              <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-widest text-right">Monto Original</th>
              <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-widest text-right">Monto Divisa</th>
              <th className="px-4 py-3 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {egresos.map((e: any) => (
              <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-700">{e.concepto}</td>
                <td className="px-4 py-3 text-slate-500">{e.descripcion}</td>
                <td className="px-4 py-3 text-right text-slate-600 font-mono">{e.monto} {e.nombre_corto}</td>
                <td className="px-4 py-3 text-right font-bold text-slate-800">${e.debito_calculado}</td>
                <td className="px-4 py-3 text-center">
                  <button 
                    className="text-red-400 hover:text-red-600 p-1 transition-colors"
                    onClick={async () => { 
                      if (!confirm('Eliminar registro?')) return
                      try {
                        await axios.delete(buildApiUrl(`/finanzas/cuadre-arqueo-egresos/${e.id}`), { withCredentials: true })
                        // refrescar desde servidor
                        manejarCargarCuadreDetallado()
                        manejarCargarEgresos()
                        //manejarCargarDatosArqueoAsesor()
                      } catch (error) {
                        console.error('error eliminando registro', error)
                      } }
                    }
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50/50 border-t border-slate-200">
            <tr>
              <td colSpan={3} className="px-4 py-4 text-right font-bold text-slate-500 uppercase text-xs">Total Egresos:</td>
              <td className="px-4 py-4 text-right font-black text-lg text-slate-800 font-mono">
                ${egresos.reduce((s, x) => s + Number(x.debito_calculado || 0), 0).toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    )}
  </div>
  <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
    <h3 className="text-lg font-bold text-slate-800 mb-4">Observacion Adicional</h3>
    <div className="flex flex-col md:flex-row md:items-end gap-3">
      <textarea
        className="w-full h-14 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
        placeholder="Ingrese alguna observación adicional sobre el arqueo..."
        
        onChange={(e) => setObservacion(e.target.value)}
        style={{ textTransform: 'uppercase' }}
      ></textarea>
      <button
        className='px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full font-medium transition-colors whitespace-nowrap'
        onClick={async ()=>{
      try {
        if( !empresaActual?.id || !selectedAsesor) return alert('Seleccione empresa y asesor')
        if(!observacion) return alert('Ingrese una observacion antes de guardar')

        await axios.post(buildApiUrl('/finanzas/cuadre-arqueo-observacion'), {
          empresa_id: empresaActual.id,
          codusua: selectedAsesor,
          fecha: date ?? new Date().toISOString().slice(0,10),
          observacion,
          usuario: usuarioAsesor,
          usuario_id: usuario?.id,
          usuario_nombre: usuario?.nombre,
        }, { withCredentials: true })

        await manejarCargarObservacionesAsesor()
        await manejarCargarObservacionGeneral()
        alert('Observacion guardada')
      } catch (error) {
        console.log('error guardando observacion', error)
      }
    }}
      >Guardar Observacion</button>
    </div>

    <div className="mt-6">
      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-tight mb-3">Observaciones del asesor (día seleccionado)</h4>

      {(!selectedAsesor || !empresaActual?.id) ? (
        <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-xl">
          <p className="text-slate-400 text-sm">Seleccione un asesor para ver sus observaciones.</p>
        </div>
      ) : cargandoObservacionesAsesor ? (
        <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-xl">
          <p className="text-slate-400 text-sm">Cargando observaciones...</p>
        </div>
      ) : observacionesAsesor.length === 0 ? (
        <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-xl">
          <p className="text-slate-400 text-sm">No hay observaciones registradas para este día.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-slate-500 text-left">
                <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-widest">Hora</th>
                <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-widest">Observación</th>
                <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-widest">Registrado por</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {observacionesAsesor.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors align-top">
                  <td className="px-4 py-3 text-slate-600 font-mono whitespace-nowrap">
                    {(() => {
                      const d = new Date(o.created_at)
                      return isNaN(d.getTime())
                        ? String(o.created_at)
                        : d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                    })()}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{o.observacion}</td>
                  <td className="px-4 py-3 text-slate-500">{o.usuario}</td>
                  <td className="px-4 py-3 text-center">
                    <button 
                        className="text-slate-300 hover:text-red-600 transition-colors p-1"
                        onClick={async () => {
                          if (!confirm('¿Eliminar registro?')) return;
                          try {
                            await axios.delete(buildApiUrl(`/finanzas/cuadre-arqueo-observaciones/${o.id}`), { withCredentials: true });
                            manejarCargarObservacionesAsesor();
                          } catch (error) { 
                            setError("No se pudo eliminar la observación.");
                            console.error(error); 
                          }
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
  <div>
    

  </div>

  {/* Botón de Cierre de Arqueo */}
  <div className="mt-12 mb-20 flex justify-center">
    <button 
      className="group relative px-12 py-4 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold text-lg shadow-xl shadow-green-200 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3"
      onClick={() => { 
        // insertamos en la tabla cuadre_arqueo_cerrado
              try {
                if (!empresaActual?.id || !selectedAsesor) return alert('Seleccione empresa y asesor')
               
                axios.post(buildApiUrl('/finanzas/cuadre-arqueo-cerrado'), {
                  empresa_id: empresaActual.id,
                  codusua: selectedAsesor,
                  usuario: usuarioAsesor,
                  fecha: date ?? new Date().toISOString().slice(0,10),
                  total_efectivo_cuadre: totalEfectivo,
                  usuario_id: usuario?.id,
                }, { withCredentials: true })
                //actualizar la lista de arqueos cerrados
                const nuevoCierre = {
                  codusua: parseInt(selectedAsesor),
                  // ...otros datos que necesites
                };
                setListaArqueosCerrados(prev => [...prev, nuevoCierre]);
                manejarCargarAsesores();
              } catch (error) {
                
              }
              alert('Arqueo cerrado');
              
       }}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04 M12 21.355c2.146 0 4.14-.56 5.86-1.543l.14-.082A11.946 11.946 0 0112 21.355z" /></svg>
      Cerrar Arqueo del Día
    </button>
  </div>

  {/* Modal de Denominaciones (Modernizado) */}
  {openModal && activeTipoPago && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-primary-600 p-6 text-white">
          <h3 className="text-xl font-bold">Denominaciones</h3>
          <p className="text-primary-100 text-sm opacity-80">{activeTipoPago.nombre}</p>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            {denominaciones.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                <span className="font-semibold text-slate-700">{d.nombre}</span>
                <input 
                  type="number" 
                  className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-right font-mono focus:ring-2 focus:ring-primary-500 outline-none" 
                  value={denomCantidades[d.id] ?? 0} 
                  onChange={(e) => handleDenomChange(d.id, e.target.value)}
                  onFocus={(e) => (e.currentTarget as HTMLInputElement).select()}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 bg-slate-50 flex gap-3 border-t border-slate-100">
          <button className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors" onClick={() => setOpenModal(false)}>Cancelar</button>
          <button className="flex-1 py-2.5 rounded-xl font-semibold bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-100 transition-all" onClick={guardarDenominaciones}>Guardar Cambios</button>
        </div>
      </div>
    </div>
  )}
</div>
    );
};

export default Arqueo;


