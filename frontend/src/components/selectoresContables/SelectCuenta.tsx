//este componente retorna dos valores el id de la cuenta y el objeto completo de la cuenta seleccionada
import Select from 'react-select';
import axios from "axios";
import React from "react";
import { buildApiUrl } from '../../config/api';
import { useAuth } from "../../context/AuthContext";

type SelectCuentaProps = {
    value: number | string | null;
    onChange: (value: number | null, label: string | null, codtipomoneda?: any) => void;
    placeholder?: string;
    className?: string;
   
};

const SelectCuenta: React.FC<SelectCuentaProps> = ({
    value,
    onChange,
    placeholder = "Seleccione Cuenta",
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
            label: cuenta.nombre,
            codtipomoneda: cuenta.nacional,
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
            onChange={(opt: any) =>{
                if(!opt){
                    onChange(null, null,null);
                }else{
                    onChange(opt.value ?? null,opt.label ?? null ,opt.codtipomoneda ?? null);
                }
            }}                      
            options={options}
            value={options.find((opt: any) => opt.value === value) || null}
            className={className}
        />
    </div>;
}
export default SelectCuenta;