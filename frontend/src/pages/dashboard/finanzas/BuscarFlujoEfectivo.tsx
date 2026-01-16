import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from "../../../context/AuthContext";
import { buildApiUrl } from '../../../config/api';
import axios from 'axios';
import Select from 'react-select';

const BuscarFlujoEfectivo: React.FC = () => {
  const { empresaActual } = useAuth();
  
  const [selectedFecha, setSelectedFecha] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [flujoEfectivo, setFlujoEfectivo] = useState<any[]>([]);  
  const [busquedaForm, setBusquedaForm] = useState<{fechaDesde: string; fechaHasta: string; descripcion: string,debito: number,credito: number}>({fechaDesde: '', fechaHasta: '', descripcion: '', debito: 0, credito: 0});
  
   useEffect(() => {
    if (empresaActual?.id) {
      // Cualquier lógica que dependa de empresaActual
    }
  }, [empresaActual?.id]);

  const formatoFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    const day = String(fecha.getDate()).padStart(2, '0');
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const year = fecha.getFullYear();
    return `${day}-${month}-${year}`;
  }

  const handleBuscar = async () => {
    if (!empresaActual?.id) {
      setError('Seleccione una empresa antes de buscar');
      return;
    }
    if (!busquedaForm.fechaDesde || !busquedaForm.fechaHasta) {
      setError('Seleccione un rango de fechas');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(buildApiUrl(`/finanzas/flujo-efectivo-siace`),{
        descripcion: busquedaForm.descripcion,
        fechaDesde: busquedaForm.fechaDesde,
        fechaHasta: busquedaForm.fechaHasta,
        empresaId: empresaActual.id,
        debito: busquedaForm.debito,
        credito: busquedaForm.credito
        },{
        withCredentials: true
        });
      
      
      const data = Array.isArray(response.data) ? response.data : (response.data?.rows ?? []);
      setFlujoEfectivo(data);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Error al buscar flujo de efectivo';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="p-6 bg-white rounded-xl shadow-lg border border-slate-200">
  {/* Encabezado con Badge de Estado */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">
        Flujo de <span className="text-red-700">Efectivo</span>
      </h2>
      <p className="text-slate-500 text-sm">Consulta y filtrado de movimientos de caja</p>
    </div>    
  </div>

  {/* Formulario de Filtros Estilizado */}
  <form className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8">
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Desde</label>
        <input 
          type="date" 
          onChange={(e) => setBusquedaForm({...busquedaForm, fechaDesde: e.target.value})} 
          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all" 
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Hasta</label>
        <input 
          type="date" 
          onChange={(e) => setBusquedaForm({...busquedaForm, fechaHasta: e.target.value})} 
          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all" 
        />
      </div>
      <div className="space-y-1 lg:col-span-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descripción</label>
        <input 
          type="text" 
          value={busquedaForm.descripcion} 
          onChange={(e) => setBusquedaForm({...busquedaForm, descripcion: e.target.value})} 
          placeholder="Ej: Pago proveedor..." 
          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all" 
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Débito</label>
        <input 
          type="number" 
          value={busquedaForm.debito} 
          onChange={(e) => setBusquedaForm({...busquedaForm, debito: parseFloat(e.target.value)})} 
          placeholder="0.00" 
          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-red-700 outline-none transition-all" 
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Crédito</label>
        <input 
          type="number" 
          value={busquedaForm.credito} 
          onChange={(e) => setBusquedaForm({...busquedaForm, credito: parseFloat(e.target.value)})} 
          placeholder="0.00" 
          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-red-700 outline-none transition-all" 
        />
      </div>
    </div>

    <div className="mt-6 flex justify-end">
      <button 
        type="button" 
        className="bg-red-700 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-red-800 shadow-lg shadow-red-100 transition-all flex items-center gap-2 active:scale-95"
        onClick={(e) => { e.preventDefault(); handleBuscar(); }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        Ejecutar Búsqueda
      </button>
    </div>
  </form>

  {/* Mensajes de Estado */}
  {loading && (
    <div className="flex items-center justify-center py-10 gap-3 text-slate-500">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-700"></div>
      <span className="font-medium">Consultando registros...</span>
    </div>
  )}
  
  {error && (
    <div className="p-4 bg-red-50 border-l-4 border-red-700 text-red-800 rounded-r-lg mb-6 flex items-center gap-2">
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
      <span className="font-semibold text-sm">{error}</span>
    </div>
  )}

  {/* Tabla de Resultados Mejorada */}
  {flujoEfectivo.length > 0 ? (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="min-w-full text-xs text-left">
        <thead className="bg-slate-800 text-slate-200">
          <tr>
            <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-slate-700">Operación</th>
            <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-slate-700">Cuenta / Concepto</th>            
            <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-slate-700">Descripción / Referencia</th>
            <th className="px-4 py-3 font-bold uppercase tracking-wider text-right border-r border-slate-700 bg-red-900/30">Débito ($)</th>
            <th className="px-4 py-3 font-bold uppercase tracking-wider text-right border-r border-slate-700 bg-green-900/30">Crédito ($)</th>
            <th className="px-4 py-3 font-bold uppercase tracking-wider text-right border-r border-slate-700 text-yellow-300">Bs Débito</th>
            <th className="px-4 py-3 font-bold uppercase tracking-wider text-right text-yellow-300">Bs Crédito</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {flujoEfectivo.map((item, index) => (
            <tr key={index} className="hover:bg-slate-50 transition-colors group">
              <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">
                {formatoFecha(item.fecha_de_operacion)}
              </td>
              <td className="px-4 py-3">
                <div className="font-bold text-slate-700">{item.nombre_cuenta}</div>
                <div className="text-[10px] text-red-700 font-bold uppercase">{item.nombre_concepto}</div>
              </td>              
              <td className="px-4 py-3 max-w-xs whitespace-normal">
                <div className="text-slate-600 line-clamp-1 group-hover:line-clamp-none transition-all">{item.descripcion}</div>
                <div className="text-[10px] text-slate-400 font-mono italic">Ref: {item.referencia}</div>
              </td>
              <td className="px-4 py-3 text-right font-mono font-bold text-red-600 bg-red-50/30">
                {item.debito ? Number(item.debito).toFixed(2) : '-'}
              </td>
              <td className="px-4 py-3 text-right font-mono font-bold text-green-600 bg-green-50/30">
                {item.credito ? Number(item.credito).toFixed(2) : '-'}
              </td>
              <td className="px-4 py-3 text-right font-mono text-slate-600">
                {item.monto_moneda_cuenta_debito ? Number(item.monto_moneda_cuenta_debito).toFixed(2) : '0.00'}
              </td>
              <td className="px-4 py-3 text-right font-mono text-slate-600">
                {item.monto_moneda_cuenta_credito ? Number(item.monto_moneda_cuenta_credito).toFixed(2) : '0.00'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-100 border-t-2 border-slate-300">
          <tr className="font-black text-slate-800">
            <td className="px-4 py-4 uppercase text-[10px]" colSpan={3}>Totales Consolidados:</td>
            <td className="px-4 py-4 text-right font-mono text-red-700 bg-red-100/50">
              {flujoEfectivo.reduce((sum, item) => sum + parseFloat(item.debito || 0), 0).toFixed(2)}
            </td>
            <td className="px-4 py-4 text-right font-mono text-green-700 bg-green-100/50">
              {flujoEfectivo.reduce((sum, item) => sum + parseFloat(item.credito || 0), 0).toFixed(2)}
            </td>
            <td className="px-4 py-4 text-right font-mono bg-slate-200/50 italic text-[11px]">
              {flujoEfectivo.reduce((sum, item) => sum + parseFloat(item.monto_moneda_cuenta_debito || 0), 0).toFixed(2)}
            </td>
            <td className="px-4 py-4 text-right font-mono bg-slate-200/50 italic text-[11px]">
              {flujoEfectivo.reduce((sum, item) => sum + parseFloat(item.monto_moneda_cuenta_credito || 0), 0).toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  ) : (
    <div className="py-20 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
      <div className="text-slate-300 mb-3">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
      </div>
      <p className="text-slate-500 font-medium">No se encontraron registros de flujo de efectivo</p>
      <p className="text-slate-400 text-xs">Ajusta los filtros arriba para iniciar una nueva búsqueda</p>
    </div>
  )}
</div>
  );
}

export default BuscarFlujoEfectivo;