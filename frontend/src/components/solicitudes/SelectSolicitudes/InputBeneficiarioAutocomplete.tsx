import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../../../config/api';

// Definimos la interfaz de lo que devuelve tu Backend
interface BeneficiarioBuscado {
    beneficiario_id: number;
    nombre: string;
    rif: string;
    cuenta_id: number;
    tipo_pago: string;
    banco: string | null;
    identificador: string;
}

interface Props {
    onSelect: (item: BeneficiarioBuscado) => void;
    className?: string;
    disabled?: boolean;
}

const InputBeneficiarioAutocomplete: React.FC<Props> = ({ onSelect, className, disabled }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<BeneficiarioBuscado[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Cierra la lista si haces clic fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // Efecto para buscar con retraso (debounce)
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length < 2) {
                setSuggestions([]);
                return;
            }

            setLoading(true);
            try {
                // Ajusta la URL base según tu configuración global de axios o escribe la completa
                // IMPORTANTE: Asegúrate de que tu axios instance tenga el token configurado, 
                // o agrega los headers aquí manualmente.
                const response = await axios.get('http://localhost:4500/api/solicitudes/buscar-beneficiario', {
                    params: { term: query },
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                
                setSuggestions(response.data);
                setShowSuggestions(true);
            } catch (error) {
                console.error("Error buscando beneficiarios", error);
            } finally {
                setLoading(false);
            }
        }, 300); // Espera 300ms después de que el usuario deja de escribir

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSelect = (item: BeneficiarioBuscado) => {
        setQuery(item.nombre); // Ponemos el nombre en el input
        setShowSuggestions(false);
        onSelect(item); // Pasamos el objeto completo al padre
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={disabled}
                    placeholder="Escribe nombre, RIF o cuenta..."
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all pl-9"
                />
                {/* Icono de lupa o spinner */}
                <div className="absolute left-3 top-2.5 text-slate-400">
                    {loading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-red-600 rounded-full border-t-transparent"></div>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    )}
                </div>
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {suggestions.map((item) => (
                        <li
                            key={`${item.beneficiario_id}-${item.cuenta_id}`}
                            onClick={() => handleSelect(item)}
                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-bold text-slate-700">{item.nombre}</p>
                                    <p className="text-xs text-slate-500">RIF: {item.rif}</p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold mb-1">
                                        {item.tipo_pago}
                                    </span>
                                    <p className="text-xs text-slate-500 font-mono">
                                        {item.banco ? `${item.banco} - ` : ''} {item.identificador}
                                    </p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            
            {showSuggestions && suggestions.length === 0 && query.length >= 2 && !loading && (
                <div className="absolute z-50 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-lg p-3 text-center text-xs text-slate-400">
                    No se encontraron resultados
                </div>
            )}
        </div>
    );
};

export default InputBeneficiarioAutocomplete;