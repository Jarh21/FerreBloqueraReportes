import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../../../config/api';

interface SelectorTiposPagoProps {
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  placeholder?: string;
  valueKey?: string; 
  labelKey?: string;
  // NUEVA PROP: Lista de nombres exactos que quieres permitir
  allowedOptions?: string[]; 
}

const SelectorTiposPago: React.FC<SelectorTiposPagoProps> = ({ 
  name, 
  value, 
  onChange, 
  className,
  placeholder = "Seleccione...",
  valueKey = "id",      
  labelKey = "nombre",
  allowedOptions // Recibimos el filtro
}) => {
  const [opciones, setOpciones] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchTipos = async () => {
      setLoading(true);
      try {
        const url = buildApiUrl('/finanzas/tipos-pago-detalle');
        const response = await axios.get(url);
        const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        setOpciones(data);
      } catch (err) {
        console.error("Error cargando selector:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTipos();
  }, []);

  // --- LÓGICA DE FILTRADO ---
  // Si 'allowedOptions' existe, filtramos. Si no, mostramos todo.
  const opcionesFiltradas = allowedOptions 
    ? opciones.filter((op: any) => allowedOptions.includes(op[labelKey]))
    : opciones;

  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`${className} ${loading ? 'opacity-50' : ''}`}
        disabled={loading}
      >
        <option value="">{loading ? "Cargando..." : placeholder}</option>
        
        {!loading && opcionesFiltradas.map((opcion: any, index: number) => (
          <option key={index} value={opcion[valueKey]}>
            {opcion[labelKey]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectorTiposPago;