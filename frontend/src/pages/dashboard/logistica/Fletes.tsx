import axios from "axios";
import React from "react";
import { useAuth } from "../../../context/AuthContext";
import { buildApiUrl } from '../../../config/api';
import SelectCuenta from "../../../components/selectoresContables/SelectCuenta";
import RegistrarVehiculo from "../../../components/logistica/RegistrarVehiculo";
interface FletesProps {
    keycodigo:number;
    fecha: string;
    documento: string;
    fiscalcomp:string;
    cliente:string;
    total:number;
    vehiculo:string;
    vehiculoId:number;
    estatus:string;    
}

interface FleteSeleccionado {
    keycodigo: number;
    total: number;
}

const Fletes: React.FC = () => {
    const [fletes, setFletes] = React.useState<FletesProps[]>([]);
    const [error, setError] = React.useState<string | null>(null);   
    const [vehiculos, setVehiculos] = React.useState<any[]>([]);
    const [selectedCuenta, setSelectedCuenta] = React.useState<number | null>(null);
    const [fletesSeleccionados, setFletesSeleccionados] = React.useState<FleteSeleccionado[]>([]);
    const [formBusquedaFletes, setFormBusquedaFletes] = React.useState<{
        fechaDesde: string;
        fechaHasta: string;
        vehiculo: number;
    }>({
        fechaDesde: "",
        fechaHasta: "",
        vehiculo: 0
    });

    // Estado para checkboxes seleccionados
  
    // Manejar selección de checkboxes
    const handleCheckboxChange = (keycodigo: number, total: number) => {
        const totalNum = Number(total) || 0;
        setFletesSeleccionados(prev => {
            const yaSeleccionado = prev.some(f => f.keycodigo === keycodigo);
            return yaSeleccionado
                ? prev.filter(f => f.keycodigo !== keycodigo)
                : [...prev, { keycodigo, total: totalNum }];
        });
    };

        // Enviar fletes seleccionados
        const handleEnviarSeleccionados = async () => {
            if (!empresaActual?.id || fletesSeleccionados.length === 0) {
                alert("Selecciona al menos un flete y asegúrate de tener una empresa activa.");
                return;
            }
            try {
                const keycodigos = fletesSeleccionados.map(f => f.keycodigo);
                const montoFletes = fletesSeleccionados.map(f => f.total);
                await axios.post(buildApiUrl('/logistica/fletes/seleccionados'), {
                    empresaId: empresaActual.id,
                    keycodigos,
                    montoFletes,
                    contCuenta: selectedCuenta
                }, { withCredentials: true });
                alert("Fletes enviados correctamente");
                setFletesSeleccionados([]);
                handleBuscarFletesVehiculos(); // Refrescar la lista de fletes
            } catch (error) {
                alert("Error al enviar fletes seleccionados");
            }
        };
    const {empresaActual} = useAuth()    

    React.useEffect(() => {
            if (!empresaActual?.id) return;
            handlelistarVehiculos();
        }, [empresaActual?.id]);

    const handleBuscarFletesVehiculos = async () => {
        // Lógica para buscar vehículos
        console.log("buscando flertes");
        try {
            const resultado = await axios.post(
                buildApiUrl('/logistica/fletes'),             
                
                    {
                        empresaId: empresaActual?.id,
                        fechaDesde: formBusquedaFletes.fechaDesde,
                        fechaHasta: formBusquedaFletes.fechaHasta,
                        vehiculo: formBusquedaFletes.vehiculo
                    },
                   { withCredentials: true }
                
            );
            setFletes(resultado.data);
            console.log("Fletes encontrados:", resultado.data);
        } catch (error) {
            console.error("Error al buscar vehículos:", error);
            setError("Error al buscar vehículos");
        };
    }

    const handlelistarVehiculos = async () => {
        // Lógica para buscar fletes según los filtros        
        try {
            const resultado = await axios.get(buildApiUrl(`/logistica/vehiculos/list/${empresaActual?.id}`),             
                 { withCredentials: true }
            );
            setVehiculos(resultado.data);
        } catch (error) {
            console.error("Error al listar vehículos:", error);
            setError("Error al listar vehículos");
        }
    };
    return (
        <div className="p-6 bg-white rounded-xl shadow-lg border border-slate-200">
  {/* Encabezado Principal */}
  <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
    <div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
        <span className="w-2 h-8 bg-red-700 rounded-full"></span>
        Fletes
      </h2>
      <p className="text-slate-500 text-sm">Consulta, filtrado y despacho de fletes vehiculares</p>
    </div>
    
    {/* Acción secundaria integrada en el label del filtro abajo, o aquí si prefieres un acceso rápido */}
  </div>

  {error && (
    <div className="bg-red-50 border-l-4 border-red-700 text-red-700 p-4 rounded-r-lg mb-6 flex items-center gap-3 animate-pulse">
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
      <span className="font-medium">{error}</span>
    </div>
  )}

  {/* Sección de Filtros */}
  <form className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8 shadow-sm">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
      
      <div className="lg:col-span-2 space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Fecha Desde</label>
        <input 
          type="date" 
          onChange={(e) => setFormBusquedaFletes(prev => ({ ...prev, fechaDesde: e.target.value }))} 
          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all" 
        />
      </div>

      <div className="lg:col-span-2 space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Fecha Hasta</label>
        <input 
          type="date" 
          onChange={(e) => setFormBusquedaFletes(prev => ({ ...prev, fechaHasta: e.target.value }))} 
          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all" 
        />
      </div>

      <div className="lg:col-span-4 space-y-1">
        <div className="flex justify-between items-center mb-1 px-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehículo</label>
          <RegistrarVehiculo onVehiculoGuardado={handlelistarVehiculos} />
        </div>
        <select
          onChange={(e) => setFormBusquedaFletes(prev => ({ ...prev, vehiculo: Number(e.target.value) }))}
          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all appearance-none"
        >
          <option value="">Todos los Vehículos</option>
          {vehiculos.map((v) => (
            <option key={v.keycodigo} value={v.keycodigo}>
              [{v.keycodigo}] {v.vehiculo}
            </option>
          ))}
        </select>
      </div>

      <div className="lg:col-span-1">
        <button 
          type="button" 
          title="Buscar"
          className="w-full md:w-auto bg-red-700 text-white p-3 rounded-lg hover:bg-red-800 shadow-md shadow-red-100 transition-all flex items-center justify-center active:scale-95"
          onClick={(e) => { e.preventDefault(); handleBuscarFletesVehiculos(); }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </button>
      </div>

      {/* Selector de Cuenta y Enviar */}
      <div className="lg:col-span-3 flex flex-col gap-2 border-l border-slate-200 pl-6 ml-auto w-full">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cuenta Destino</label>
        <div className="flex gap-2">
          <div className="flex-1">
            <SelectCuenta value={selectedCuenta} onChange={setSelectedCuenta} />
          </div>
          <button
            type="button"
            className="bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 shadow-md shadow-blue-100 transition-all disabled:opacity-30 disabled:grayscale active:scale-95"
            onClick={handleEnviarSeleccionados}
            disabled={fletesSeleccionados.length === 0 || selectedCuenta === null}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  </form>

  {/* Tabla de Resultados */}
  <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
    {fletes.length === 0 ? (
      <div className="text-center text-slate-400 py-16 bg-slate-50/50 italic">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        No hay fletes que coincidan con la búsqueda.
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-800 text-slate-200">
              <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-widest border-r border-slate-700">Fecha / ID</th>
              <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-widest border-r border-slate-700">Documento / Fiscal</th>
              <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-widest border-r border-slate-700">Cliente</th>
              <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-widest border-r border-slate-700 text-right">Total</th>
              <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-widest border-r border-slate-700">Vehículo</th>
              <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-widest border-r border-slate-700 text-center">Estado</th> 
              <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-widest text-center">Sel.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fletes.map((flete, index) => {
              const isSelected = fletesSeleccionados.some(f => f.keycodigo === flete.keycodigo);
              return (
                <tr key={index} className={`transition-colors hover:bg-slate-50 ${isSelected ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-700">{flete.fecha}</div>
                    <div className="text-[10px] text-slate-400 font-mono">ID: {flete.keycodigo}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-600 italic">{flete.documento}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Fiscal: {flete.fiscalcomp}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{flete.cliente}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-800 bg-slate-50/30">
                    ${Number(flete.total).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-semibold border border-slate-200">
                       {flete.vehiculo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                      flete.estatus === 'CERRADO' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {flete.estatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      checked={isSelected}
                      onChange={() => handleCheckboxChange(flete.keycodigo, flete.total)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
</div>
    );
};
export default Fletes; 