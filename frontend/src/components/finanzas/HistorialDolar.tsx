import React from "react";
import axios from "axios";
import { buildApiUrl } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

type TipoMoneda = {
    keycodigo: number;
    nombre_singular?: string;
    abreviatura?: string;
    is_nacional?: number;
    precio_venta_moneda_nacional?: number;
};

type HistorialTasa = {
    id: number;
    fecha: string;
    tipo_moneda_id: number;
    tasa_de_cambio: number;
    created_at?: string;
    abreviatura?: string;
    nombre_singular?: string;
};

const formatearFecha = (fechaIso: string) => {
    if (!fechaIso) return "";
    const soloFecha = fechaIso.split("T")[0];
    const [anio, mes, dia] = soloFecha.split("-");
    if (!anio || !mes || !dia) return fechaIso;
    return `${dia}/${mes}/${anio}`;
};

const HistorialDolar: React.FC = () => {
    const { empresaActual } = useAuth();
    const [abierto, setAbierto] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [tipos, setTipos] = React.useState<TipoMoneda[]>([]);
    const [historial, setHistorial] = React.useState<HistorialTasa[]>([]);
    const [tasaApi, setTasaApi] = React.useState<number | null>(null);
    const [editandoId, setEditandoId] = React.useState<number | null>(null);
    const [form, setForm] = React.useState({
        tipo_moneda_id: "",
        tasa_de_cambio: "",
        fecha: new Date().toISOString().slice(0, 10),
    });

    React.useEffect(() => {
        if (tasaApi === null || editandoId) return;
        setForm((prev) => ({
            ...prev,
            tasa_de_cambio: String(tasaApi),
        }));
    }, [tasaApi, editandoId]);

    const resetearFormulario = React.useCallback(() => {
        setForm((prev) => ({
            ...prev,
            tasa_de_cambio: "",
            fecha: new Date().toISOString().slice(0, 10),
        }));
        setEditandoId(null);
    }, []);

    const cargarDatos = React.useCallback(async () => {
        if (!empresaActual?.id) return;
        setLoading(true);
        setError(null);
        try {
            const [tiposRes, historialRes] = await Promise.all([
                axios.get(buildApiUrl(`/finanzas/tipo-moneda-catalogo/${empresaActual.id}`), { withCredentials: true }),
                axios.get(buildApiUrl(`/finanzas/tipo-moneda-historial/${empresaActual.id}`), { withCredentials: true }),
            ]);
            setTipos(tiposRes.data ?? []);
            setHistorial(historialRes.data ?? []);

            if (!form.tipo_moneda_id && (tiposRes.data ?? []).length > 0) {
                setForm((prev) => ({
                    ...prev,
                    tipo_moneda_id: String(tiposRes.data[0].keycodigo),
                }));
            }
        } catch (err) {
            console.error("Error al cargar tasas", err);
            setError("No se pudieron cargar las tasas");
        } finally {
            setLoading(false);
        }
    }, [empresaActual?.id, form.tipo_moneda_id]);

    React.useEffect(() => {
        if (!abierto) return;
        cargarDatos();
        handleTasaApi();
    }, [abierto, cargarDatos]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.tipo_moneda_id || !form.tasa_de_cambio || !form.fecha) {
            setError("Completa todos los campos");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const payload = {
                tipo_moneda_id: Number(form.tipo_moneda_id),
                tasa_de_cambio: Number(form.tasa_de_cambio),
                fecha: form.fecha,
            };

            if (editandoId) {
                await axios.put(
                    buildApiUrl(`/finanzas/tipo-moneda-historial/${editandoId}`),
                    payload,
                    { withCredentials: true }
                );
            } else {
                await axios.post(
                    buildApiUrl("/finanzas/tipo-moneda-historial"),
                    payload,
                    { withCredentials: true }
                );
            }

            await cargarDatos();
            resetearFormulario();
        } catch (err) {
            console.error("Error al registrar tasa", err);
            setError(editandoId ? "No se pudo editar la tasa" : "No se pudo registrar la tasa");
        } finally {
            setLoading(false);
        }
    };
    const handleTasaApi = async () => {
        try {
            setLoading(true);
            setError(null);
            const externalResponse = await axios.get('https://ve.dolarapi.com/v1/dolares/oficial');
            setTasaApi(externalResponse.data.promedio);
        } catch (err) {
            console.error("Error al obtener tasa desde API", err);
            setError("No se pudo obtener la tasa desde la API");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div>
            <button
                type="button"
                className="px-3 py-2 text-xs font-bold rounded-lg bg-slate-100 border border-slate-200 hover:bg-slate-200"
                onClick={() => setAbierto(true)}
            >
                Historial de tasas
            </button>

            {abierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <h3 className="text-sm font-black text-slate-800">Historial de tasas</h3>
                            <button
                                type="button"
                                className="text-xs font-bold text-slate-500 hover:text-slate-700"
                                onClick={() => setAbierto(false)}
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {error && (
                                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                                    {error}
                                </div>
                            )}

                            <form className="grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={handleSubmit}>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Moneda</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg px-2 py-2"
                                        value={form.tipo_moneda_id}
                                        onChange={(e) => setForm((prev) => ({ ...prev, tipo_moneda_id: e.target.value }))}
                                    >
                                        <option value="">Seleccione</option>
                                        {tipos.map((t) => (
                                            <option key={t.keycodigo} value={t.keycodigo}>
                                                {t.abreviatura ?? t.nombre_singular ?? t.keycodigo}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tasa</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg px-2 py-2"
                                        value={form.tasa_de_cambio}
                                        onChange={(e) => setForm((prev) => ({ ...prev, tasa_de_cambio: e.target.value }))}
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg px-2 py-2"
                                        value={form.fecha}
                                        onChange={(e) => setForm((prev) => ({ ...prev, fecha: e.target.value }))}
                                    />
                                </div>

                                <div className="md:col-span-3 flex justify-end">
                                    {editandoId && (
                                        <button
                                            type="button"
                                            className="px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 mr-2"
                                            onClick={resetearFormulario}
                                            disabled={loading}
                                        >
                                            Cancelar edición
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className="px-3 py-2 text-xs font-bold rounded-lg bg-red-700 text-white hover:bg-red-800 disabled:opacity-50"
                                        disabled={loading}
                                    >
                                        {editandoId ? "Guardar cambios" : "Guardar tasa"}
                                    </button>
                                </div>
                            </form>

                            <div className="border rounded-lg overflow-hidden">
                                <div className="max-h-72 overflow-auto">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-800 text-slate-100">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Fecha</th>
                                                <th className="px-3 py-2 text-left">Moneda</th>
                                                <th className="px-3 py-2 text-right">Tasa</th>
                                                <th className="px-3 py-2 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {historial.length === 0 ? (
                                                <tr>
                                                    <td className="px-3 py-3 text-slate-400" colSpan={4}>
                                                        {loading ? "Cargando..." : "Sin registros"}
                                                    </td>
                                                </tr>
                                            ) : (
                                                historial.map((h) => (
                                                    <tr key={h.id} className="hover:bg-slate-50">
                                                        <td className="px-3 py-2">{formatearFecha(h.fecha)}</td>
                                                        <td className="px-3 py-2">
                                                            {h.abreviatura ?? h.nombre_singular ?? h.tipo_moneda_id}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-mono">
                                                            {Number(h.tasa_de_cambio).toFixed(4)}
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            <button
                                                                type="button"
                                                                className="text-[10px] font-bold text-blue-700 hover:text-blue-900"
                                                                onClick={() => {
                                                                    setEditandoId(h.id);
                                                                    setForm({
                                                                        tipo_moneda_id: String(h.tipo_moneda_id),
                                                                        tasa_de_cambio: String(h.tasa_de_cambio),
                                                                        fecha: h.fecha,
                                                                    });
                                                                }}
                                                            >
                                                                Editar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistorialDolar;