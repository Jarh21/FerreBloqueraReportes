import React, { useEffect } from "react";
import Select, { MultiValue, StylesConfig } from "react-select";
import { buildApiUrl } from "../../../config/api";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";

type VehiculoOption = { value: number; label: string };

type FleteCancelado = {
    vehiculo: string;
    fecha_cancelado: string;
    cont_cuenta_id: number | string;
    cont_concepto_id: number | string;
    monto: number;
    monto_moneda: number;
};

const ReporteFletes: React.FC = () => {
    const { empresaActual } = useAuth();
    const [error, setError] = React.useState<string | null>(null);
    const [vehiculos, setVehiculos] = React.useState<any[]>([]);
    const [fletesCancelados, setFletesCancelados] = React.useState<FleteCancelado[]>([]);
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
        handleListarVehiculos();
    }, []);

    const vehiculoOptions = React.useMemo<VehiculoOption[]>(
        () =>
            (vehiculos ?? []).map((v) => ({
                value: Number(v.keycodigo),
                label: `[${v.keycodigo}] ${v.vehiculo}`,
            })),
        [vehiculos]
    );

    const selectedVehiculoOptions = React.useMemo<MultiValue<VehiculoOption>>(
        () => vehiculoOptions.filter((option) => formBusquedaFletes.vehiculos.includes(option.value)),
        [formBusquedaFletes.vehiculos, vehiculoOptions]
    );

    const handleListarVehiculos = async () => {
        try {
            const resultado = await axios.get(
                buildApiUrl(`/logistica/vehiculos/list/${empresaActual?.id}/0,1`),
                { withCredentials: true }
            );
            setVehiculos(resultado.data);
        } catch (error) {
            console.error("Error al listar vehiculos:", error);
            setError("Error al listar vehiculos");
        }
    };

    const handleBuscarFletesCancelados = async () => {
        try {
            const resultado = await axios.post(
                buildApiUrl(`/logistica/fletes-cancelados`),
                {
                    empresaId: empresaActual?.id,
                    fechaDesde: formBusquedaFletes.fechaDesde,
                    fechaHasta: formBusquedaFletes.fechaHasta,
                    vehiculos: formBusquedaFletes.vehiculos,
                },
                { withCredentials: true }
            );
            setFletesCancelados(resultado.data ?? []);
            console.log("Fletes cancelados obtenidos:", resultado.data);
            setError(null);
        } catch (error) {
            console.error("Error al buscar fletes cancelados:", error);
            setError("Error al buscar fletes cancelados");
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
                backgroundColor: state.isSelected ? "#b91c1c" : state.isFocused ? "#f8fafc" : "white",
                color: state.isSelected ? "white" : "#0f172a",
            }),
        }),
        []
    );

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <span className="w-2 h-8 bg-red-700 rounded-full"></span>
                        <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 6h14M5 12h14M5 18h14" />
                        </svg>
                        Reporte Fletes Cancelados
                    </h2>
                    <p className="text-slate-500 text-sm">Listado de fletes cancelados por fecha y vehiculo</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-700 text-red-700 p-4 rounded-r-lg mb-6 flex items-center gap-3 animate-pulse">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    <span className="font-medium">{error}</span>
                </div>
            )}

            <form className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
                    <div className="lg:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Fecha Desde</label>
                        <input
                            type="date"
                            onChange={(e) => setFormBusquedaFletes((prev) => ({ ...prev, fechaDesde: e.target.value }))}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all"
                        />
                    </div>

                    <div className="lg:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Fecha Hasta</label>
                        <input
                            type="date"
                            onChange={(e) => setFormBusquedaFletes((prev) => ({ ...prev, fechaHasta: e.target.value }))}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all"
                        />
                    </div>

                    <div className="lg:col-span-7 space-y-1">
                        <div className="flex justify-between items-center mb-1 px-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehiculo</label>
                        </div>
                        <Select<VehiculoOption, true>
                            isMulti
                            isClearable
                            closeMenuOnSelect={false}
                            options={vehiculoOptions}
                            value={selectedVehiculoOptions}
                            placeholder="Todos los vehiculos"
                            noOptionsMessage={() => "No hay vehiculos"}
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
                            onClick={(e) => { e.preventDefault(); handleBuscarFletesCancelados(); }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </button>
                    </div>
                </div>
            </form>

            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                {fletesCancelados.length === 0 ? (
                    <div className="text-center text-slate-400 py-16 bg-slate-50/50 italic">
                        <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        No hay fletes cancelados para el filtro seleccionado.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="bg-slate-800 text-slate-200">
                                    <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-widest border-r border-slate-700">Vehiculo</th>
                                    <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-widest border-r border-slate-700">Fecha Cancelado</th>
                                    <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-widest border-r border-slate-700">Cuenta</th>
                                    <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-widest border-r border-slate-700">Concepto</th>
                                    <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-widest border-r border-slate-700 text-right">Monto</th>
                                    <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-widest text-right">Monto Moneda</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {fletesCancelados.map((flete, index) => (
                                    <tr key={index} className="transition-colors hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-700 border-r border-slate-100">{flete.vehiculo}</td>
                                        <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{flete.fecha_cancelado}</td>
                                        <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{flete.cont_cuenta_id}</td>
                                        <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{flete.cont_concepto_id}</td>
                                        <td className="px-4 py-3 text-slate-600 border-r border-slate-100 text-right">
                                            {Number(flete.monto || 0).toLocaleString(undefined, { style: "currency", currency: "USD" })}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 text-right">
                                            {Number(flete.monto_moneda || 0).toLocaleString(undefined, { style: "currency", currency: "USD" })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReporteFletes;