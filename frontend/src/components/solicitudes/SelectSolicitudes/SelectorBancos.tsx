import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../../../config/api';

interface SelectorBancosProps {
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  placeholder?: string;
  valueKey?: string; 
  labelKey?: string; 
}

const SelectorBancos: React.FC<SelectorBancosProps> = ({ 
  name, 
  value, 
  onChange, 
  className,
  placeholder = "Seleccione Banco...",
  // ADAPTACIÓN CLAVE:
  // Según tu JSON, el nombre está en la propiedad "ENTIDAD"
  valueKey = "ENTIDAD", 
  labelKey = "ENTIDAD"  
}) => {
  const [bancos, setBancos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchBancos = async () => {
      setLoading(true);
      try {
        const url = buildApiUrl('/solicitudes/entidades'); 
        const response = await axios.get(url);
        
        // Ajustamos según si la API devuelve el array directo o dentro de un objeto
        const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        
        setBancos(data);
      } catch (err) {
        console.error("Error cargando bancos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBancos();
  }, []);

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
        
        {!loading && bancos.map((banco: any, index: number) => (
          // Usamos 'keycodigo' como key única de React (es lo ideal según tu JSON)
          // Pero el valor que se guarda en el form será el nombre ("Banco de Venezuela")
          <option key={banco.keycodigo || index} value={banco[valueKey]}>
            {banco[labelKey]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectorBancos;