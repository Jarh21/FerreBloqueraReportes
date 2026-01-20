import Select from 'react-select';
import axios from "axios";
import React from "react";
import { buildApiUrl } from '../../config/api';
import { useAuth } from "../../context/AuthContext";

type SelectCuentaProps = {
    value: number | null;
    onChange: (value: number | null) => void;
    placeholder?: string;
    className?: string;
};

const SelectCuenta: React.FC<SelectCuentaProps> = ({
    value,
    onChange,
    placeholder = "Seleccione cuenta a debitar",
    className = "text-sm px-2",
}) => {
     const {empresaActual} = useAuth()
    const [contCuenta, setContCuenta] = React.useState<any[]>([]);
        React.useEffect(() => {
            if (!empresaActual?.id) return;
            obtenerContableCuenta();
        }, [empresaActual?.id]);

    // Opciones para el Select de cuentas contables
    const options = [
        { value: '', label: 'Seleccione cuenta', isDisabled: true },
        ...contCuenta.map((cuenta: any) => ({
            value: cuenta.keycodigo,
            label: cuenta.nombre
        }))
    ];
    
    const obtenerContableCuenta = async () => {
        try {
            const resultado = await axios.get(`${buildApiUrl('/finanzas/contable-cuenta/')}${empresaActual?.id}`, { withCredentials: true });
            setContCuenta(resultado.data);
        } catch (error) {
            console.error("Error al obtener cuenta contable:", error);
        }
    };

    return <div>
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
            placeholder={placeholder}
            onChange={(opt: any) => onChange(opt?.value ?? null)}                       
            options={options}
            value={options.find((opt: any) => opt.value === value) || null}
            className={className}
        />
    </div>;
}
export default SelectCuenta;