import Select from 'react-select';
import axios from "axios";
import React from "react";
import { buildApiUrl } from '../../../config/api';
import { useAuth } from "../../../context/AuthContext";

// 1. Actualizamos el nombre de la interfaz de Props
type SelectorContableProps = {
    value: string | null; 
    onChange: (value: string | null) => void; 
    placeholder?: string;
    className?: string;
};

// 2. Renombramos el componente
const SelectorContable: React.FC<SelectorContableProps> = ({
    value,
    onChange,
    placeholder = "Seleccione Concepto",
    className = "text-sm px-2",
}) => {
    const {empresaActual} = useAuth();
    const [contConcepto, setContConcepto] = React.useState<any[]>([]);

    React.useEffect(() => {
        if (!empresaActual?.id) return;
        obtenerContableConcepto();
    }, [empresaActual?.id]);

    const options = [
        { value: '', label: 'Seleccione concepto', isDisabled: true },
        ...contConcepto.map((concepto: any) => ({
            value: concepto.nombre, // Usamos el nombre como valor
            label: concepto.nombre
        }))
    ];
    
    const obtenerContableConcepto = async () => {
        try {
            const resultado = await axios.get(`${buildApiUrl('/finanzas/conceptos-contables/')}${empresaActual?.id}`, { withCredentials: true });
            setContConcepto(resultado.data);
        } catch (error) {
            console.error("Error al obtener cuenta contable:", error);
        }
    };

    return (
        <div>
            <Select 
                menuPlacement="auto"
                styles={{
                    control: (base) => ({
                        ...base,
                        backgroundColor: '#f8fafc',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.5rem',
                        minHeight: '38px',
                        height: '38px',
                        fontSize: '0.875rem',
                        boxShadow: 'none',
                        '&:hover': { borderColor: '#94a3b8' }
                    }),
                    valueContainer: (base) => ({
                        ...base,
                        padding: '0 8px',
                        height: '38px',
                        display: 'flex',
                        alignItems: 'center'
                    }),
                    menu: (base) => ({ ...base, zIndex: 9999 })
                }}
                getOptionValue={(opt: any) => opt.value}
                placeholder={placeholder}
                onChange={(opt: any) => onChange(opt?.value ?? null)}                       
                options={options}
                value={options.find((opt: any) => opt.value === value) || null}
                className={className}
            />
        </div>
    );
}

// 3. Exportamos con el nuevo nombre
export default SelectorContable;