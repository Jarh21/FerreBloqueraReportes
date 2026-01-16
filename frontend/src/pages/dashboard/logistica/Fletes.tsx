import axios from "axios";
import React from "react";
import Select from 'react-select';
import { useAuth } from "../../../context/AuthContext";
import { buildApiUrl } from '../../../config/api';
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

const Fletes: React.FC = () => {
    const [fletes, setFletes] = React.useState<FletesProps[]>([]);
    const [montoFletes, setMontoFletes] = React.useState<number>(0);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string | null>(null);   
    const [vehiculos, setVehiculos] = React.useState<any[]>([]);
    const [contCuenta, setContCuenta] = React.useState<any[]>([]);
    const [selectedCuenta, setSelectedCuenta] = React.useState<number | null>(null);
    const [fletesSeleccionados, setFletesSeleccionados] = React.useState<number[]>([]);
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
            const yaSeleccionado = prev.includes(keycodigo);
            setMontoFletes(montoPrev => (yaSeleccionado ? montoPrev - totalNum : montoPrev + totalNum));
            return yaSeleccionado
                ? prev.filter(id => id !== keycodigo)
                : [...prev, keycodigo];
        });
    };

        // Enviar fletes seleccionados
        const handleEnviarSeleccionados = async () => {
            if (!empresaActual?.id || fletesSeleccionados.length === 0) {
                alert("Selecciona al menos un flete y asegúrate de tener una empresa activa.");
                return;
            }
            try {
                await axios.post(buildApiUrl('/logistica/fletes/seleccionados'), {
                    empresaId: empresaActual.id,
                    keycodigos: fletesSeleccionados,
                    montoFletes: montoFletes,
                    contCuenta: selectedCuenta
                }, { withCredentials: true });
                alert("Fletes enviados correctamente");
                setFletesSeleccionados([]);
                setMontoFletes(0);
            } catch (error) {
                alert("Error al enviar fletes seleccionados");
            }
        };
    const {empresaActual} = useAuth()    

    React.useEffect(() => {
        handlelistarVehiculos();
        obtenerContableCuenta();
    }, []);

    const obtenerContableCuenta = async () => {
        try {
            const resultado = await axios.get(`${buildApiUrl('/finanzas/contable-cuenta/')}${empresaActual?.id}`, { withCredentials: true });
            setContCuenta(resultado.data);
        } catch (error) {
            console.error("Error al obtener cuenta contable:", error);
            setError("Error al obtener cuenta contable");
        }
    };

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
    // Opciones para el Select de cuentas contables
    const options = [
        { value: '', label: 'Seleccione cuenta', isDisabled: true },
        ...contCuenta.map((cuenta: any) => ({
            value: cuenta.keycodigo,
            label: cuenta.nombre
        }))
    ];
    return (
        <div className="p-6 bg-white rounded-xl shadow-lg border border-slate-200">
            {/* Encabezado con Badge de Estado */}
            <div className="flex items-center justify-between mb-6">
                <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                    Fletes
                </h2>
                <p className="text-slate-500 text-sm">Consulta y filtrado los fletes</p>
                </div>    
            </div>
            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
                    {error}
                </div>
            )}
            {/* Formulario de Filtros Estilizado */}
            <form className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Desde</label>
                            <input 
                            type="date" 
                            onChange={(e) => {
                                
                                setFormBusquedaFletes(prev => ({ ...prev, fechaDesde: e.target.value }));
                            }} 
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all" 
                            />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Hasta</label>
                            <input 
                            type="date" 
                            onChange={(e) => {                            
                                setFormBusquedaFletes(prev => ({ ...prev, fechaHasta: e.target.value }));
                            }} 
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all" 
                            />
                    </div>
                    <div className="space-y-1 lg:col-span-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Vehiculos</label>
                        <select
                            onChange={(e) => setFormBusquedaFletes(prev => ({ ...prev, vehiculo: Number(e.target.value) }))}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all"
                        >
                            <option value="">Todos los Vehiculos</option>
                            {vehiculos.map((vehiculo) => (
                                <option key={vehiculo.keycodigo} value={vehiculo.keycodigo}>
                                    ({vehiculo.keycodigo}) {vehiculo.vehiculo}
                                </option>
                            ))}

                        </select>
                        
                    </div>
                    <div className="mt-6 flex justify-start ">
                        <button 
                            type="button" 
                            className="bg-red-700 text-white px-4 py-1 rounded-lg font-bold hover:bg-red-800 shadow-lg shadow-red-100 transition-all flex items-center gap-1 active:scale-95"
                            onClick={(e) => { e.preventDefault(); handleBuscarFletesVehiculos(); }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            
                        </button>
                    </div>
                           
                </div>
                    <div className="mt-6  flex justify-end">
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
                            placeholder="Seleccione cuenta a debitar"
                            onChange={(opt: any) => setSelectedCuenta(opt?.value ?? null)}                       
                            options={options}
                            value={options.find((opt: any) => opt.value === selectedCuenta) || null}
                            className="text-sm px-2"
                        />
                        <button
                            type="button"
                            className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center gap-2 active:scale-95"
                            onClick={handleEnviarSeleccionados}
                            disabled={fletesSeleccionados.length === 0 || selectedCuenta === null}
                        >
                            Enviar Seleccionados
                        </button>
                    </div>             
                
            </form>
            {/* Tabla de Resultados */}
            {fletes.length === 0 ? (
                <div className="text-center text-slate-500 py-10">
                    No se encontraron fletes con los criterios especificados.
                </div>
            ) : (
            <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse border border-slate-200">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-600">Fecha</th>
                            <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-600">Documento</th>
                            <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-600">Comprobante Fiscal</th>
                            <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-600">Cliente</th>
                            <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-600">Total</th>
                            <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-600">Vehículo</th>
                            <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-600">Estado</th> 
                            <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-600">Seleccion</th>                           
                        </tr>
                    </thead>
                    <tbody>
                        {fletes.map((flete, index) => (
                            <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700">({flete.keycodigo}){flete.fecha}</td>
                                <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700">{flete.documento}</td>
                                <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700">{flete.fiscalcomp}</td>
                                <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700">{flete.cliente}</td>
                                <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700">{flete.total}</td>
                                <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700">({flete.vehiculoId}){flete.vehiculo}</td>
                                <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700">{flete.estatus}</td>
                                <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={fletesSeleccionados.includes(flete.keycodigo)}
                                        onChange={() => handleCheckboxChange(flete.keycodigo, flete.total)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Botón para enviar fletes seleccionados */}
                
            </div>
            )}
            
        </div>
    );
};
export default Fletes; 