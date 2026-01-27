import React, { useEffect } from "react";
import Select, { MultiValue, StylesConfig } from "react-select";
import { buildApiUrl } from '../../../config/api';
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
type VehiculoOption = { value: number; label: string };
type DetalleProducto = {
    codprod: number | string;
    producto: string;
    cantidad: number;
};

type DetalleVehiculo = {
    vehiculoId: number;
    vehiculo: string;
    items: DetalleProducto[];
};

const ReporteFletes: React.FC = () => {
    const { empresaActual } = useAuth();
    const [error, setError] = React.useState<string | null>(null);
    const [vehiculos, setVehiculos] = React.useState<any[]>([]);
    const [totalFletes, setTotalFletes] = React.useState<any[]>([]);
    const [detalleVehiculos, setDetalleVehiculos] = React.useState<DetalleVehiculo[]>([]);
    const [loadingDetalle, setLoadingDetalle] = React.useState(false);
    const [formBusquedaFletes, setFormBusquedaFletes] = React.useState<{
        fechaDesde: string;
        fechaHasta: string;
        vehiculos: number[];
    }>({
        fechaDesde: "",
        fechaHasta: "",
        vehiculos: [],
    });

    useEffect(() => {
        handlelistarVehiculos();
    }, []);

    const vehiculoOptions = React.useMemo<VehiculoOption[]>(
        () =>
        (vehiculos ?? []).map((v) => ({
            value: Number(v.keycodigo),
            label: `[${v.keycodigo}] ${v.vehiculo}`,
        })),
        [vehiculos]
    );
    const handlelistarVehiculos = async () => {
        // Lógica para buscar fletes según los filtros        
        try {
            const resultado = await axios.get(buildApiUrl(`/logistica/vehiculos/list/${empresaActual?.id}/0,1`),             
                    { withCredentials: true }
            );
            setVehiculos(resultado.data);
        } catch (error) {
            console.error("Error al listar vehículos:", error);
            setError("Error al listar vehículos");
        }
    };
    const selectedVehiculoOptions = React.useMemo<MultiValue<VehiculoOption>>(
        () =>
        vehiculoOptions.filter((option) =>
            formBusquedaFletes.vehiculos.includes(option.value)
        ),
        [formBusquedaFletes.vehiculos, vehiculoOptions]
    );

    const handleBuscarFletesVehiculos = async () => {
        try {
            const resultado = await axios.post(buildApiUrl(`/logistica/fletes/total-por-vehiculo`), {
                empresaId: empresaActual?.id,
                fechaDesde: formBusquedaFletes.fechaDesde,
                fechaHasta: formBusquedaFletes.fechaHasta,
                vehiculos: formBusquedaFletes.vehiculos,
            },{withCredentials: true});
            setTotalFletes(resultado.data);
            setError(null);

            if (!resultado.data || resultado.data.length === 0) {
                setDetalleVehiculos([]);
                return;
            }

            setLoadingDetalle(true);
            try {
                const detalle = await Promise.all(
                    resultado.data.map(async (tflete: any) => {
                        const vehiculoId = Number(tflete.ultimo_cod_logistica_vehiculo_asignado);
                        const resp = await axios.post(
                            buildApiUrl(`/logistica/fletes/detalle-por-vehiculo`),
                            {
                                empresaId: empresaActual?.id,
                                vehiculoId,
                                fechaDesde: formBusquedaFletes.fechaDesde,
                                fechaHasta: formBusquedaFletes.fechaHasta,
                            },
                            { withCredentials: true }
                        );
                        return {
                            vehiculoId,
                            vehiculo: tflete.vehiculo,
                            items: resp.data ?? [],
                        } as DetalleVehiculo;
                    })
                );
                setDetalleVehiculos(detalle);
            } catch (error) {
                console.error("Error al obtener detalle por vehículo:", error);
                setError("Error al obtener detalle de productos por vehículo");
                setDetalleVehiculos([]);
            } finally {
                setLoadingDetalle(false);
            }
        } catch (error) {
            setError("Error al obtener fletes por vehículo. "+error);
        }
    };
    const vehiculoSelectStyles = React.useMemo<StylesConfig<VehiculoOption, true>>(
          () => ({
            control: (base, state) => ({
              ...base,
              minHeight: "42px",
              borderRadius: "0.5rem",
              borderColor: state.isFocused ? "#b91c1c" : "#e2e8f0",
              boxShadow: state.isFocused ? "0 0 0 2px rgba(185, 28, 28, 0.35)" : "none",
              "&:hover": { borderColor: state.isFocused ? "#b91c1c" : "#cbd5e1" },
              fontSize: "0.875rem",
            }),
            valueContainer: (base) => ({ ...base, padding: "0.25rem 0.5rem" }),
            input: (base) => ({ ...base, margin: 0, padding: 0 }),
            placeholder: (base) => ({ ...base, color: "#94a3b8" }),
            multiValue: (base) => ({
              ...base,
              backgroundColor: "#f1f5f9",
              border: "1px solid #e2e8f0",
              borderRadius: "0.5rem",
            }),
            multiValueLabel: (base) => ({ ...base, color: "#334155", fontWeight: 600 }),
            multiValueRemove: (base) => ({
              ...base,
              color: "#64748b",
              ":hover": { backgroundColor: "#fee2e2", color: "#b91c1c" },
            }),
            menu: (base) => ({ ...base, borderRadius: "0.75rem", overflow: "hidden" }),
            option: (base, state) => ({
              ...base,
              fontSize: "0.875rem",
              backgroundColor: state.isSelected
                ? "#b91c1c"
                : state.isFocused
                  ? "#f8fafc"
                  : "white",
              color: state.isSelected ? "white" : "#0f172a",
            }),
          }),
          []
        );
    return(
        <div className="p-6 bg-white rounded-xl shadow-lg border border-slate-200">
            {/* Encabezado Principal */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="w-2 h-8 bg-red-700 rounded-full"></span>
                    Reporte Fletes Pagados
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

                    <div className="lg:col-span-7 space-y-1">
                        <div className="flex justify-between items-center mb-1 px-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehículo</label>
                        
                        </div>
                        <Select<VehiculoOption, true>
                        isMulti
                        isClearable
                        closeMenuOnSelect={false}
                        options={vehiculoOptions}
                        value={selectedVehiculoOptions}
                        placeholder="Todos los Vehículos"
                        noOptionsMessage={() => "No hay vehículos"}
                        onChange={(newValue: MultiValue<VehiculoOption>) => {
                            const seleccion = newValue.map((o) => o.value);
                            setFormBusquedaFletes((prev) => ({ ...prev, vehiculos: seleccion }));
                        }}
                        className="w-full"
                        styles={vehiculoSelectStyles}
                        />
                        
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

                </div>
            </form> 
            {/* Tabla de Resultados */}
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                {totalFletes.length === 0 ? (
                <div className="text-center text-slate-400 py-16 bg-slate-50/50 italic">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    No hay fletes que coincidan con la búsqueda.
                </div>
                ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-slate-800 text-slate-200">
                            <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-widest border-r border-slate-700">Vehiculo</th> 
                            <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-widest border-r border-slate-700">Cantidad Fact</th>
                            <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-widest border-r border-slate-700">Monto Total</th>                            
                            <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-widest border-r border-slate-700">Promedio x Factura</th>
                            <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-widest border-r border-slate-700">Clientes</th>
                            <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-widest border-r border-slate-700">% Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {totalFletes.map((tflete, index) => (
                            <tr key={index} className="border-b border-slate-200 hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-700 border-r border-slate-100">{tflete.ultimo_cod_logistica_vehiculo_asignado}-{tflete.vehiculo}</td>
                                <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{tflete.cantidad_facturas}</td>
                                <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{tflete.monto_total.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                                <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{tflete.promedio_por_factura}</td>
                                <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{tflete.clientes_distintos_atendidos}</td>                                
                                <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{tflete.porcentaje_del_total}%</td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}
            </div>
            {/* Tabla de productos por cada vehiculo */}
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm mt-6">
                {loadingDetalle ? (
                    <div className="text-center text-slate-400 py-10 bg-slate-50/50 italic">
                        Cargando detalle de productos...
                    </div>
                ) : detalleVehiculos.length === 0 ? (
                    <div className="text-center text-slate-400 py-10 bg-slate-50/50 italic">
                        No hay detalle de productos para mostrar.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200">
                        {detalleVehiculos.map((detalle) => (
                            <div key={detalle.vehiculoId} className="p-4">
                                <div className="flex items-center justify-between mb-3 mt-4">
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                                        Vehículo: {detalle.vehiculoId} - {detalle.vehiculo}
                                    </h3>
                                    <span className="text-xs text-slate-400">
                                        {detalle.items.length} productos
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead>
                                            <tr className="bg-slate-100 text-slate-600">
                                                <th className="px-3 py-2 font-bold uppercase text-[10px] tracking-widest border-r border-slate-200">Código</th>
                                                <th className="px-3 py-2 font-bold uppercase text-[10px] tracking-widest border-r border-slate-200">Producto</th>
                                                <th className="px-3 py-2 font-bold uppercase text-[10px] tracking-widest">Cantidad</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {detalle.items.map((item) => (
                                                <tr key={`${detalle.vehiculoId}-${item.codprod}`}>
                                                    <td className="px-3 py-2 text-slate-600 border-r border-slate-100">{item.codprod}</td>
                                                    <td className="px-3 py-2 text-slate-600 border-r border-slate-100">{item.producto}</td>
                                                    <td className="px-3 py-2 text-slate-600">{Number(item.cantidad).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>  
        </div>

    );

};

export default ReporteFletes;