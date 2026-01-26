import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../../../config/api';

interface InputBancosProps {
  name: string;
  value: string; // El nombre del banco seleccionado
  onChange: (e: { target: { name: string; value: string } }) => void; // Simulamos evento estándar
  className?: string;
  placeholder?: string;
}

const InputBancosAutocomplete: React.FC<InputBancosProps> = ({ 
  name, 
  value, 
  onChange, 
  className,
  placeholder = "Escriba el banco..."
}) => {
  const [bancos, setBancos] = useState<any[]>([]);
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 1. Cargar Bancos al inicio
  useEffect(() => {
    const fetchBancos = async () => {
      try {
        const url = buildApiUrl('/solicitudes/entidades'); 
        const response = await axios.get(url);
        const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        setBancos(data);
      } catch (err) {
        console.error("Error cargando bancos:", err);
      }
    };
    fetchBancos();
  }, []);

  // 2. Efecto para cerrar sugerencias si hago click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setMostrarSugerencias(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // 3. Manejar escritura
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const texto = e.target.value;
    // Comunicar al padre el cambio de texto
    onChange({ target: { name, value: texto } });

    // Filtrar sugerencias
    if (texto.length > 0) {
      const filtrados = bancos.filter((banco: any) => 
        banco.ENTIDAD.toLowerCase().includes(texto.toLowerCase())
      );
      setSugerencias(filtrados);
      setMostrarSugerencias(true);
    } else {
      setMostrarSugerencias(false);
    }
  };

  // 4. Seleccionar una sugerencia
  const seleccionarBanco = (nombreBanco: string) => {
    onChange({ target: { name, value: nombreBanco } });
    setMostrarSugerencias(false);
  };

  // 5. Limpiar input (Botón X)
  const limpiarInput = () => {
    onChange({ target: { name, value: '' } });
    setSugerencias([]);
    setMostrarSugerencias(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
            type="text"
            name={name}
            value={value}
            onChange={handleInputChange}
            onClick={() => value && setMostrarSugerencias(true)} // Mostrar si ya hay algo
            className={className}
            placeholder={placeholder}
            autoComplete="off"
        />
        {/* Botón de Limpiar (X) - Solo aparece si hay texto */}
        {value && (
            <button 
                type="button"
                onClick={limpiarInput}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-red-600 p-1 rounded-full transition-colors"
                title="Limpiar campo"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        )}
      </div>

      {/* Lista Flotante de Sugerencias */}
      {mostrarSugerencias && sugerencias.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-b-lg shadow-lg max-h-48 overflow-y-auto mt-1">
          {sugerencias.map((banco: any, index) => (
            <li 
              key={index}
              onClick={() => seleccionarBanco(banco.ENTIDAD)}
              className="px-4 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
            >
              {banco.ENTIDAD}
            </li>
          ))}
        </ul>
      )}
      
      {/* Mensaje si no hay resultados */}
      {mostrarSugerencias && sugerencias.length === 0 && value.length > 0 && (
         <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-b-lg shadow-lg p-2 text-xs text-slate-400 text-center mt-1">
             No se encontraron bancos
         </div>
      )}
    </div>
  );
};

export default InputBancosAutocomplete;