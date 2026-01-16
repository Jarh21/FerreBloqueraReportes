//informe efectivo
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from "../../../context/AuthContext";
import { buildApiUrl } from '../../../config/api';
import axios from 'axios';
import Select from 'react-select';

interface DetalleEfectivo {
  
  cantidad: number;
  total: number;
  total_calculado:number;
  id: number;
  denominacion: string;
  codusua: number;
  tipo_moneda_id: number;
  tipo_pago_id: number;
  tipo_nombre: string;
}

interface TotalCalculadoPorAsesor {
  empresa_id?: number;
  fecha?: string;
  codusua: number;
  usuario?: string;
  total_calculado: number;
}

interface ComparativoAsesorRow {
  codusua: number;
  usuario: string;
  total_db1: number;
  total_db2: number;
  diferencia: number;
}
const InformeEfectivo: React.FC =  () => {
  const [detalleEfectivo, setDetalleEfectivo] = useState<DetalleEfectivo[]>([]);
  const [detalleEgresos, setDetalleEgresos] = useState<DetalleEfectivo[]>([]);
  const [gastosConceptos, setGastosConceptos] = useState<any[]>([]);
  const {empresaActual} = useAuth()
  const [gastoForm, setGastoForm]= useState<{id:number; contConcepto: string;contConceptoNombre:string; descripcion: string; tipoPagoId: number; credito: number;valor_tasa:number }>({id:0, contConcepto: '',contConceptoNombre:'', descripcion: '', tipoPagoId: 0, credito: 0,valor_tasa:0})
  const [selectedFecha, setSelectedFecha]= useState<string | null>(null)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conceptos, setConceptos]= useState<any[]>([])
  // Estados para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGasto, setSelectedGasto] = useState<any>(null);
  const [tasaHoy, setTasaHoy]= useState<number>(0.00);
  const [sumaTotalCalculadoGeneral, setSumaTotalCalculadoGeneral]= useState<number>(0.00);
  const [totalEfectivoMovPagos, setTotalEfectivoMovPagos]= useState<TotalCalculadoPorAsesor[]>([]);
  const [totalEfectivoYGastosAgrupadosPorAsesor, setTotalEfectivoYGastosAgrupadosPorAsesor]= useState<TotalCalculadoPorAsesor[]>([]);
  const [observaciones, setObservaciones]= useState<any[]>([]);
  // Función para abrir el modal con los datos
  const abrirModalEdicion = (gasto: any) => {
  setSelectedGasto(gasto);
  setGastoForm({
    contConcepto: String(gasto.cont_concepto_id), // Aseguramos que sea string para el Select
    contConceptoNombre:gasto.cont_concepto_nombre,
    tipoPagoId: gasto.tipo_pago_id ,
    credito: gasto.credito,    
    valor_tasa:tasaHoy,    
    descripcion: gasto.descripcion,
    id:gasto.id
  });

  setIsModalOpen(true);
};

  // Función para cerrar
  const cerrarModal = () => {
    setIsModalOpen(false);
    setSelectedGasto(null);
  };

  useEffect(() => {
  if(selectedFecha) {
    (async () => {
      const [efectivo, egresos] = await Promise.all([
        manejarCargaDetalleEfectico(),
        manejarCargaDetalleEgresos(),
      ])

      // Ya con data fresca (no estado viejo), calcular el total calculado general
      handleSumaTotalCalculado(efectivo, egresos)

      // el resto puede correr en paralelo
      await Promise.all([
        handleTotalEfectivoMovPagosAsesor(),
        handleTotalEfectivoYGastosAgrupadosPorAsesor(),
        manejarObtenerGastosPorFecha(),
        cargarConceptos(),
        obtenerTasaCambioActual(),
        handleObtenerObservaciones(),
      ])
    })()
    }
  }, [selectedFecha]);
  //optenemos el valor de la tasa de cambio actual con la siguiente api
  const obtenerTasaCambioActual = async () => {
    try {
      let tasa: number;
      
      // 1. Intenta con tu API
      const localResponse = await axios.get(
        buildApiUrl(`/finanzas/cuadre-obtener-tasa-siace/${empresaActual?.id}/${selectedFecha}`), 
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
      console.error("Error al obtener tasa:", err);
      
      // Último recurso: valor por defecto
      const tasaDefault = 0.00;
      setTasaHoy(tasaDefault);
      return tasaDefault;
    }            
  }

  const manejarCargaDetalleEfectico = async (): Promise<DetalleEfectivo[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        buildApiUrl(`/finanzas/cuadre-listar-todo-efectivo-detallado/${empresaActual?.id}/${selectedFecha}`),
        { withCredentials: true }
      );
      const data: DetalleEfectivo[] = response.data || [];
      setDetalleEfectivo(data);
      return data;
    } catch (error) {
      setError('Error al cargar los datos. Verifique la conexión o intente más tarde.');
      console.error("Error:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }
    const cargarConceptos = async ()=>{
      //cargamos los conceptos de la base de datos del siace
      if (!empresaActual?.id) return
      try {
        const resp = await axios.get(buildApiUrl(`/finanzas/conceptos-contables/${empresaActual.id}`), { withCredentials: true })
        setConceptos(resp.data || [])
      } catch (error) {
        console.error('error cargando conceptos contables', error)
      }
    }

   const manejarCargaDetalleEgresos = async (): Promise<DetalleEfectivo[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        buildApiUrl(`/finanzas/cuadre-listar-todo-efectivo-egresos/${empresaActual?.id}/${selectedFecha}`),
        { withCredentials: true }
      );
      const data: DetalleEfectivo[] = response.data || [];
      setDetalleEgresos(data);
      return data;
    } catch (error) {
      setError('Error al cargar los datos. Verifique la conexión o intente más tarde.');
      console.error("Error:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  const manejarObtenerGastosPorFecha = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        buildApiUrl(`/finanzas/cuadre-obtener-gastos-conceptos/${empresaActual?.id}/${selectedFecha}`),
        { withCredentials: true }
      );
      setGastosConceptos(response.data);
    } catch (error) {
      setError('Error al cargar los datos. Verifique la conexión o intente más tarde.');
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleActualizarGasto = async () => {
    try {
      const contConceptoNombreFallback =
        gastoForm.contConceptoNombre ||
        conceptos.find(c => String(c.keycodigo) === gastoForm.contConcepto)?.nombre ||
        null;

      const datosActualizados = {
        cont_concepto_id: parseInt(gastoForm.contConcepto) || null,
        cont_concepto_nombre: contConceptoNombreFallback,
        descripcion: gastoForm.descripcion,
        monto: gastoForm.credito,
        tipoPago: gastoForm.tipoPagoId ,
        valor_tasa: gastoForm.valor_tasa,
      };

      await axios.put(
        buildApiUrl(`/finanzas/cuadre-editar-gastos/${selectedGasto.id}`),
        datosActualizados,
        { withCredentials: true }
      );


      await manejarObtenerGastosPorFecha();
      await manejarCargaDetalleEgresos();
      
      cerrarModal();
    } catch (error) {
      console.error("Error al actualizar el gasto:", error);
      alert('Error al actualizar el gasto');
    }
      
  };

  const handleSumaTotalCalculado = (
    efectivo: DetalleEfectivo[] = detalleEfectivo,
    egresos: DetalleEfectivo[] = detalleEgresos,
  ) => {
    const totalEfectivo = efectivo.reduce((sum, item) => sum + Number(item.total_calculado ?? 0), 0);
    const totalEgresos = egresos.reduce((sum, egreso) => sum + Number(egreso.total_calculado ?? 0), 0);
    setSumaTotalCalculadoGeneral(totalEfectivo + totalEgresos);
  };

  const handleTotalEfectivoMovPagosAsesor = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        buildApiUrl(`/finanzas/cuadre-total-efectivo-mov-pagos/${empresaActual?.id}/${selectedFecha}`),
        { withCredentials: true }
      );
      setTotalEfectivoMovPagos(response.data || []);
    } catch (error) {
      setError('Error al cargar los datos. Verifique la conexión o intente más tarde.');
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleTotalEfectivoYGastosAgrupadosPorAsesor = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        buildApiUrl(`/finanzas/cuadre-total-efectivo-egresos/${empresaActual?.id}/${selectedFecha}`),
        { withCredentials: true }
      );
      setTotalEfectivoYGastosAgrupadosPorAsesor(response.data || []) ;     
      
    } catch (error) {
      setError('Error al cargar los datos. Verifique la conexión o intente más tarde.');
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  const comparativoAsesores = useMemo<ComparativoAsesorRow[]>(() => {
    const mapDb1 = new Map<number, TotalCalculadoPorAsesor>()
    totalEfectivoMovPagos.forEach((row) => {
      if (typeof row?.codusua === 'number') mapDb1.set(row.codusua, row)
    })

    const mapDb2 = new Map<number, TotalCalculadoPorAsesor>()
    totalEfectivoYGastosAgrupadosPorAsesor.forEach((row) => {
      if (typeof row?.codusua === 'number') mapDb2.set(row.codusua, row)
    })

    const codusuaSet = new Set<number>([...mapDb1.keys(), ...mapDb2.keys()])
    return Array.from(codusuaSet)
      .sort((a, b) => a - b)
      .map((codusua) => {
        const r1 = mapDb1.get(codusua)
        const r2 = mapDb2.get(codusua)

        const total_db1 = Number(r1?.total_calculado ?? 0)
        const total_db2 = Number(r2?.total_calculado ?? 0)

        // Regla solicitada: si falta en cualquiera de las dos tablas, marcar Desconocido
        const usuarioNombre = (!r1 || !r2)
          ? 'Desconocido'
          : String(r1.usuario ?? r2.usuario ?? 'Desconocido')

        return {
          codusua,
          usuario: usuarioNombre,
          total_db1,
          total_db2,
          diferencia: total_db2 - total_db1,
        }
      })
  }, [totalEfectivoMovPagos, totalEfectivoYGastosAgrupadosPorAsesor])

  const handleObtenerObservaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        buildApiUrl(`/finanzas/cuadre-arqueo-observaciones-general/${empresaActual?.id}/${selectedFecha}`),
        { withCredentials: true }
      );
      setObservaciones(response.data || []);
    } catch (error) {
      setError('Error al cargar las observaciones. Verifique la conexión o intente más tarde.');
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
  {/* Encabezado con Estilo Corporativo */}
  <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
    <div>
      <h1 className="text-3xl font-black text-slate-800 tracking-tight">
        Informe de <span className="text-red-700">Efectivo</span>
      </h1>
      <p className="text-slate-500 text-sm">Consulta histórica de arqueos y movimientos. EMPRESA ID {empresaActual?.id}</p>
    </div>

    {/* Selector de Fecha Estilizado */}
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-2">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha del Arqueo</label>
      <div className="relative">
        <input 
          type="date" 
          className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-red-700 outline-none transition-all font-medium text-slate-700"
          onChange={(e) => setSelectedFecha(e.target.value)}
          max={new Date().toISOString().split('T')[0]} 
        />
        {loading && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-700 border-t-transparent"></div>
          </div>
        )}
      </div>
    </div>
  </div>

  {error && (
    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-700 text-red-800 rounded-r-lg flex items-center gap-3">
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
      <p className="text-sm font-semibold">{error}</p>
    </div>
  )}

  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
    {/* COLUMNA RELACIÓN (GASTOS/CONCEPTOS) - Ocupa 5/12 */}
    <div className="xl:col-span-8 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 p-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Relación de Gastos y Conceptos
            {gastosConceptos.length > 0 && (
              <button className="ml-auto text-xs bg-red-700 hover:bg-slate-600 text-white px-3 py-1 rounded-lg transition-colors"
            onClick={
              
              
              async ()=>{
                
              if(!selectedFecha) {
                setError('Debe seleccionar una fecha para exportar');
                return;
              }
              setError(null);
               try {
                const response = await axios.get(
                  buildApiUrl(`/finanzas/exportar-flujo-efectivo-siace/${empresaActual?.id}/${selectedFecha}`),
                  { withCredentials: true }
                );
                //setResultadoExport(response.data);
                if(response.data.mensaje){
                  alert(response.data.mensaje +" total registros: "+ response.data.totalRegistros + " con el Numero de Comprobante: "+ response.data.nuevoComprobante);
                }
                
                              
              } catch (error: unknown) {
                // Mostrar el error del backend (p.ej. 409 YA_EXPORTADO) en el banner del componente
                if (axios.isAxiosError(error)) {
                  const backendMsg = (error.response?.data as any)?.error;
                  setError(backendMsg || error.message || 'Error al exportar la relación.');
                } else {
                  setError('Error al exportar la relación.');
                }
                console.error("Error al exportar:", error);
              }
              
            }} 
            >Exportar Relación</button>
            )}
            
          </h3>
        </div>
        
        <div className="p-2">
          {gastosConceptos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 uppercase text-[10px] tracking-widest">
                    <th className="px-2 py-1">Concepto</th>
                    <th className="px-2 py-1">Cuenta</th>
                    <th className="px-2 py-1 text-right">Débito</th>
                    <th className="px-2 py-1 text-right">Crédito</th>
                    <th className="px-2 py-1">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {gastosConceptos.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-2 py-4">
                        <div className="font-bold text-slate-700">{item.concepto}</div>
                      </td>
                      <td className="px-2 py-4">
                        <div className='columns-3 sm:columns-3'>                          
                          <div className="text-[11px] text-slate-400 group-hover:text-red-700 transition-colors uppercase">{item.nombre_cuenta}</div>
                          <div className="text-xs text-slate-500 mt-1 italic leading-tight">{item.descripcion}</div>
                        </div>                        
                      </td>
                      <td className="px-2 py-4 text-right font-mono text-green-600">
                        {item.debito > 0 ? `${Number(item.debito).toFixed(2)}` : ''}
                      </td>
                      <td className="px-2 py-4 text-right font-mono font-bold text-red-600">
                        {item.credito > 0 ? `-${Number(item.credito).toFixed(2)}` : ''}
                      </td>
                      <td className="px-2 py-4">
                        {item.credito > 0 ? (
                            <button 
                              className="text-xs text-gray-200 hover:text-red-700  px-2 py-1 rounded-lg hover:bg-red-200 transition-colors"
                              onClick={() => abrirModalEdicion(item)}
                            >
                              Editar
                            </button>
                          ): null
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 italic">No hay registros para esta fecha</div>
          )}

          
        </div>
      </div>

      {/* Comparación por asesor (DB1 vs DB2) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 p-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Dieferencias por Asesor: SIACE vs Efectivo
          </h3>
        </div>

        <div className="p-2">
          {!selectedFecha ? (
            <div className="py-10 text-center text-slate-400 italic">Seleccione una fecha para ver la comparación</div>
          ) : comparativoAsesores.length === 0 ? (
            <div className="py-10 text-center text-slate-400 italic">No hay datos para comparar en esta fecha</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 uppercase text-[10px] tracking-widest">
                    <th className="px-2 py-2">Codusua</th>
                    <th className="px-2 py-2">Usuario</th>
                    <th className="px-2 py-2 text-right">Sistema</th>
                    <th className="px-2 py-2 text-right">Efectivo recibido</th>
                    <th className="px-2 py-2 text-right">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {comparativoAsesores.map((row) => (
                    <tr key={row.codusua} className="hover:bg-slate-50 transition-colors">
                      <td className="px-2 py-3 font-mono text-slate-600">{row.codusua}</td>
                      <td className="px-2 py-3 font-semibold text-slate-700">{row.usuario}</td>
                      <td className="px-2 py-3 text-right font-mono text-slate-700">{Number(row.total_db1).toFixed(2)}</td>
                      <td className="px-2 py-3 text-right font-mono text-slate-700">{Number(row.total_db2).toFixed(2)}</td>
                      <td className={`px-2 py-3 text-right font-mono font-bold ${row.diferencia === 0 ? 'text-slate-500' : row.diferencia > 0 ? 'text-emerald-600' : 'text-rose-600'}`}> 
                        {Number(row.diferencia).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 font-bold text-slate-700">
                    <td className="px-2 py-3" colSpan={2}>Totales</td>
                    <td className="px-2 py-3 text-right font-mono">{comparativoAsesores.reduce((sum, row) => sum + Number(row.total_db1), 0).toFixed(2)}</td>
                    <td className="px-2 py-3 text-right font-mono">{comparativoAsesores.reduce((sum, row) => sum + Number(row.total_db2), 0).toFixed(2)}</td>
                    <td className="px-2 py-3 text-right font-mono">{comparativoAsesores.reduce((sum, row) => sum + Number(row.diferencia), 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
      {/** tabla de observaciones */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 p-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Observaciones Generales
          </h3>
        </div>
        <div className="p-2">
          {observaciones.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 uppercase text-[10px] tracking-widest">
                    <th className="px-2 py-2">Usuario</th>
                    <th className="px-2 py-2">Observación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {observaciones.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-2 py-4 font-semibold text-slate-700">{item.usuario}</td>
                      <td className="px-2 py-4 text-slate-600">{item.observacion}</td>                      
                    </tr> 
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-slate-400">No hay observaciones generales.</p>
          )}
        </div>
      </div>
    </div>

    {/* COLUMNA DETALLE EFECTIVO - Ocupa 7/12 */}
    <div className="xl:col-span-4 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-red-700 p-4 flex justify-between items-center">
          <h3 className="text-white font-bold flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Desglose de Efectivo Detallado
            
          </h3>
        </div>
        <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
          {detalleEfectivo.length > 0 && (
              <span className="ml-auto text-xs bg-yellow-300 text-red-700 px-3 py-1 rounded-lg font-bold uppercase">Total Calculado: {sumaTotalCalculadoGeneral.toFixed(2)}</span>
          )}
        </div>
          
        <div className="p-6">
          {detalleEfectivo.length > 0 ? (
            <div className="grid grid-cols-1  gap-6">
              {Object.entries(
                detalleEfectivo.reduce<Record<number, DetalleEfectivo[]>>((acc, item) => {
                  const key = item.tipo_pago_id;
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(item);
                  return acc;
                }, {} as Record<number, DetalleEfectivo[]>)
              ).map(([tipoPagoId, items]) => {
                const sumaTotal = items.reduce((sum, i) => sum + Number(i.total), 0);                
                const egresosTotal = detalleEgresos
                  .filter(egreso => egreso.tipo_pago_id.toString() === tipoPagoId)
                  .reduce((sum, egreso) => sum + Number(egreso.total), 0);
                const tipoNombre = items[0]?.tipo_nombre || "Efectivo";

                return (
                  <div key={tipoPagoId} className="bg-slate-50 rounded-xl border border-slate-200 flex flex-col overflow-hidden">
                    <div className="px-4 py-3 bg-white border-b border-slate-200 flex justify-between items-center">
                      <span className="font-black text-slate-700 uppercase text-xs tracking-tighter">{tipoNombre}</span>
                      <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Auditoría</span>
                    </div>

                    <table className="w-full text-[11px]">
                      <tbody className="divide-y divide-slate-200">
                        {items.map((item) => (
                          <tr key={item.id} className="hover:bg-white transition-colors">
                            <td className="px-4 py-2 text-slate-600 font-medium italic">{item.denominacion}</td>
                            <td className="px-4 py-2 text-center text-slate-400">x{item.cantidad}</td>
                            <td className="px-4 py-2 text-right font-mono font-bold text-slate-800">{item.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="mt-auto p-4 bg-white border-t border-slate-200 space-y-1">
                      <div className="flex justify-between text-xs text-slate-500 italic">
                        <span>{tipoNombre}:</span>
                        <span>{sumaTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-red-500 italic">
                        <span>Egresos:</span>
                        <span>-{egresosTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-black text-red-700 pt-2 border-t border-slate-100">
                        <span className="uppercase">Total </span>
                        <span className="font-mono">{(sumaTotal + egresosTotal).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="text-slate-300 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <p className="text-slate-400 font-medium">Seleccione una fecha para visualizar el desglose</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  {/* MODAL DE EDICIÓN */}
  {isModalOpen && selectedGasto && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
      {/* Cabecera del Modal */}
      <div className="bg-slate-800 p-4 flex justify-between items-center">
        <h3 className="text-white font-bold">Editar Movimiento</h3>
        <button 
          type="button"
          onClick={cerrarModal} 
          className="text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Formulario */}
      <form 
        className="p-6 space-y-4" 
        onSubmit={async (e) => { 
          e.preventDefault(); 
          await handleActualizarGasto();
        }}
      >
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Concepto</label>
          
          <Select 
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: '#f8fafc',
                borderColor: '#e2e8f0',
                borderRadius: '0.5rem',
                padding: '2px',
              }),
            }}
            options={conceptos.map(c => ({ 
              value: String(c.keycodigo), 
              label: c.nombre,
              
               
            }))}
            getOptionValue={(opt: any) => `${String(opt.value)}-${String(opt.label)}`}
            value={
              gastoForm.contConcepto
                ? {
                    value: gastoForm.contConcepto,
                    label:
                      conceptos.find(c => String(c.keycodigo) === gastoForm.contConcepto)?.nombre ||
                      gastoForm.contConceptoNombre ||
                      '',
                  }
                : null
            }
            onChange={(opt: any) => setGastoForm(prev => ({ 
              ...prev, 
              contConcepto: opt?.value ?? '',
              // Si el usuario no selecciona nada (o limpia), no borres el nombre actual
              contConceptoNombre: opt?.label ?? prev.contConceptoNombre ?? '',

            }))}
            placeholder="Seleccione un concepto..."
            noOptionsMessage={() => "No se encontraron conceptos"}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tasa</label>
            <input 
              type="number" 
              value={gastoForm.valor_tasa}
              onChange={(e) => setGastoForm(prev => ({ 
                ...prev, 
                valor_tasa: parseFloat(e.target.value) || 0 
              }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Crédito</label>
            <input 
              type="number" 
              value={gastoForm.credito}
              onChange={(e) => setGastoForm(prev => ({ 
                ...prev, 
                credito: parseFloat(e.target.value) || 0 
              }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descripción</label>
          <textarea 
            rows={3}
            value={gastoForm.descripcion}
            onChange={(e) => setGastoForm(prev => ({ 
              ...prev, 
              descripcion: e.target.value 
            }))}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
          />
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 pt-4">
          <button 
            type="button"
            onClick={cerrarModal}
            className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg font-bold hover:bg-red-800 shadow-lg shadow-red-700/20 transition-all"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  </div>
  )}
</div>
  );
}
export default InformeEfectivo;