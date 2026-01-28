import Select from 'react-select';
import axios from "axios";
import React from "react";
import { buildApiUrl } from '../../config/api';
import { useAuth } from "../../context/AuthContext";

type SelectConceptoProps = {
    value: number | null;
    onChange: (value: number | null) => void;
    placeholder?: string;
    className?: string;
};

const SelectConcepto: React.FC<SelectConceptoProps> = ({
    value,
    onChange,
    placeholder = "Seleccione Concepto",
    className = "text-sm px-2",
}) => {
     const {empresaActual} = useAuth()
    const [contConcepto, setContConcepto] = React.useState<any[]>([]);
        React.useEffect(() => {
            if (!empresaActual?.id) return;
            obtenerContableConcepto();
        }, [empresaActual?.id]);

    // Opciones para el Select de conceptos contables
    const options = [
        { value: '', label: 'Seleccione concepto', isDisabled: true },
        ...contConcepto.map((concepto: any) => ({
            value: concepto.keycodigo,
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

    return <div>
        <Select 
            menuPlacement="auto"
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
            placeholder={placeholder}
            onChange={(opt: any) => onChange(opt?.value ?? null)}                       
            options={options}
            value={options.find((opt: any) => opt.value === value) || null}
            className={className}
        />
    </div>;
}
export default SelectConcepto;