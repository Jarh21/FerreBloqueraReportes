import React, { useEffect, useState } from "react";
import axios from "axios";
import { buildApiUrl } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

type RegistrarVehiculoProps = {
    onVehiculoGuardado?: () => void;
};

const RegistrarVehiculo: React.FC<RegistrarVehiculoProps> = ({ onVehiculoGuardado }) => {
    const [isOpen, setIsOpen] = useState(false);
    const {empresaActual}= useAuth();
    const [vehiculos, setVehiculos] = useState<Array<{keycodigo:number; vehiculo:string; is_vehiculo_externo:number;}>>([]);
    const [vehiculosSiace, setVehiculosSiace] = useState<Array<{keycodigo:number; vehiculo:string}>>([]);
    const [formData, setFormData] = useState<{
        marca: string;
        modelo: string;
        placa: string;
        observacion: string;
        asociadoSiace: number;
        localForaneo: number;
    }>({
        marca: "",
        modelo: "",
        placa: "",
        observacion: "",
        asociadoSiace: 0,
        localForaneo: 0
    });
    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

    useEffect(() => {
        
        if (!isOpen) return;
        //si preciona escape cierra el modal
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeModal();
        };

        document.addEventListener("keydown", onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        if (empresaActual?.id) {
            obtenerVehiculosRegistrados();
            handlelistarVehiculosSiace();
        }

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
        
    }, [isOpen, empresaActual?.id]);

    const obtenerVehiculosRegistrados = async () => {
        try{
            const response = await axios.get(buildApiUrl(`/logistica/vehiculos/list/${empresaActual?.id}/0,1`),{ withCredentials: true });
            setVehiculos(response.data);
        }catch(error){
            console.error("error al obtener vehiculos registrados: ", error);
        }
    }
    const handlelistarVehiculosSiace = async () => {
        // Lógica para buscar fletes según los filtros        
        try {
            const resultado = await axios.get(buildApiUrl(`/logistica/vehiculos-siace/list/${empresaActual?.id}`),{ withCredentials: true });
            setVehiculosSiace(resultado.data);
        } catch (error) {
            console.error("Error al listar vehículos:", error);
           
        }
    };

    const  handleGuardarVehiculo= async (): Promise<boolean> => {
        console.log("datos del formulario",formData);
        try {            
            await  axios.post(buildApiUrl(`/logistica/fletes/guardar-vehiculo`),{
                empresaId: empresaActual?.id,
                marca: formData.marca,
                modelo: formData.modelo,
                placa: formData.placa,
                observacion: formData.observacion,
                asociadoSiace: formData.asociadoSiace,
                localForaneo: formData.localForaneo
            },{ withCredentials: true });
            return true;
        } catch (error) {
            console.error("Error al guardar vehículo:", error);
            return false;
        }
    };

    //Cerrar modal al enviar el formulario
    /* const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // TODO: integrar con API / estado global
        handleGuardarVehiculo(formData);
        closeModal();
    }; */

    return (
        <div className="inline-flex">
            <button  
                type="button"
                onClick={openModal}
                className="bg-red-700 text-white px-3 py-2 rounded-lg font-bold hover:bg-red-800 shadow-lg shadow-red-100 transition-all flex items-center gap-1 active:scale-95 text-xs"
            >
                + Vehiculo 
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={closeModal}
                        aria-hidden="true"
                    />

                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="registrar-vehiculo-title"
                        className="relative z-10 w-full max-w-4xl rounded-xl bg-white shadow-lg border border-slate-200 mx-4 flex flex-col max-h-[90vh]"
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <h2 id="registrar-vehiculo-title" className="text-2xl font-black text-slate-800 tracking-tight">
                                Registrar Vehículo
                            </h2>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-700"
                                aria-label="Cerrar"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="h-5 w-5"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 1 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>

                        <div className="px-6 py-5 flex-1 overflow-y-auto">
                            <form className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Marca</label>
                                    <input
                                        value={formData.marca}
                                        onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                                        type="text"
                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Modelo</label>
                                    <input
                                    value={formData.modelo}
                                    onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
                                        type="text"
                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all"
                                    />
                                </div>
                                <div className="md:col-span-1 space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Placa</label>
                                    <input
                                        value={formData.placa}
                                        onChange={(e) => setFormData(prev => ({ ...prev, placa: e.target.value }))}
                                        type="text"
                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all"
                                    />
                                </div>
                                <div className="md:col-span-1 space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Observación</label>
                                    <input
                                        value={formData.observacion}
                                        onChange={(e) => setFormData(prev => ({ ...prev, observacion: e.target.value }))}
                                        type="text"
                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all"
                                    />
                                </div>
                                <div className="md:col-span-1 space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Asociar con</label>
                                    <select 
                                        value={formData.asociadoSiace}
                                        onChange={(e) => setFormData(prev => ({ ...prev, asociadoSiace: Number(e.target.value) }))}
                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all"
                                    >
                                        <option value={0}>-- No asociar --</option>
                                        {vehiculosSiace.map((vehiculo) => (
                                            <option key={vehiculo.keycodigo} value={vehiculo.keycodigo}>
                                                {vehiculo.keycodigo}- {vehiculo.vehiculo}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-1 space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Local o Foráneo</label>
                                    <div className="mt-1 flex items-center gap-6">
                                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                            <input
                                                type="radio"
                                                name="localForaneo"
                                                value={0}
                                                checked={formData.localForaneo === 0}
                                                onChange={(e) => setFormData(prev => ({ ...prev, localForaneo: Number(e.target.value) }))}
                                            />
                                            <span>Local</span>
                                        </label>
                                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                            <input
                                                type="radio"
                                                name="localForaneo"
                                                value={1}
                                                checked={formData.localForaneo === 1}
                                                onChange={(e) => setFormData(prev => ({ ...prev, localForaneo: Number(e.target.value) }))}
                                            />
                                            <span>Foraneo</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="md:col-span-3 flex items-center justify-end gap-2 pt-2">
                                    
                                    <button
                                        type="button"
                                        className="bg-red-700 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-800 shadow-lg shadow-red-100 transition-all flex items-center gap-2 active:scale-95"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            const ok = await handleGuardarVehiculo();
                                            if (!ok) return;
                                            await obtenerVehiculosRegistrados();
                                            onVehiculoGuardado?.();
                                            closeModal();
                                        }}
                                    >
                                        Registrar Vehículo
                                    </button>
                                </div>
                            </form>
                            <div className="overflow-x-auto">
                                <table className="min-w-full mt-6 table-auto border-collapse border border-slate-200">
                                    <thead>
                                        <tr className="bg-slate-100">
                                            <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-600">Código</th>
                                            <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-600">Vehículo</th>
                                            <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-600">Local/Foráneo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vehiculos.map((vehiculo) => (
                                            <tr key={vehiculo.keycodigo}>
                                                <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700">{vehiculo.keycodigo}</td>
                                                <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700">{vehiculo.vehiculo}</td>
                                                <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700">{vehiculo.is_vehiculo_externo === 0 ? "Local" : "Foraneo"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                    </div>
                </div>
            )}
        </div>
    );
};
export default RegistrarVehiculo; 