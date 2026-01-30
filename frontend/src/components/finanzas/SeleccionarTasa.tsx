import React from 'react';
import axios from "axios";
import { buildApiUrl } from '../../config/api';
import { useAuth } from "../../context/AuthContext";

interface TipoMoneda {
    keycodigo: number;    
    abreviatura: string;
    valor: number;
    tipoMoneda:number;
}

interface SeleccionarTasaProps {
    value?: number | '';
    onChange?: (value: number | '', origen: string) => void;
}

const SeleccionarTasa: React.FC<SeleccionarTasaProps> = ({ value, onChange }) => {
    const { empresaActual } = useAuth();

    const [tipoMoneda, setTipoMoneda] = React.useState<TipoMoneda[]>([]);
    const [origenTasa, setOrigenTasa] = React.useState<string>('');
    const [tasaValor, setTasaValor] = React.useState<number | ''>(value ?? '');

    const handleObtenerTodosTipoMoneda = async () => {
        const response = await axios.get(buildApiUrl(`/finanzas/tipo-moneda/${empresaActual?.id}`), { withCredentials: true });
        console.log("Tipo de Moneda frontend:", response.data);
        setTipoMoneda(response.data);
    };

    React.useEffect(() => {
        if (empresaActual?.id) handleObtenerTodosTipoMoneda();
    }, [empresaActual?.id]);

    React.useEffect(() => {
        if (tipoMoneda.length > 0 && !origenTasa) {
            const first = tipoMoneda[0];
            setOrigenTasa(first.keycodigo.toString());
            setTasaValor(Number(first.valor));
        }
    }, [tipoMoneda, origenTasa]);

    React.useEffect(() => {
        if (value !== undefined) setTasaValor(value);
    }, [value]);

    React.useEffect(() => {
        if (onChange) onChange(tasaValor, origenTasa);
    }, [tasaValor, origenTasa, onChange]);

    return (
        <div className="w-full">
            <div className='w-full'>
                <div className="flex w-full">
                    <select
                        name="origenTasa"
                        id="origenTasa"
                        value={origenTasa}
                        onChange={(e) => {
                            const valueSelect = e.target.value;
                            setOrigenTasa(valueSelect);
                            if (valueSelect === 'MANUAL') {
                                setTasaValor('');
                                return;
                            }
                            const moneda = tipoMoneda.find((m) => m.keycodigo.toString() === valueSelect);
                            setTasaValor(moneda ? Number(moneda.valor) : '');
                        }}
                        className="bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 rounded-l-lg px-2 py-2 outline-none focus:bg-white hover:bg-slate-200 transition-colors cursor-pointer min-w-[88px]"
                    >
                        {tipoMoneda.map((moneda) => (
                            <option key={moneda.keycodigo} value={moneda.keycodigo}>
                                {moneda.abreviatura}-{moneda.tipoMoneda}
                            </option>
                        ))}
                        <option value="MANUAL">Manual</option>
                    </select>
                    <input 
                        type="number" 
                        step="0.01"
                        value={tasaValor}
                        onChange={(e) => setTasaValor(e.target.value === '' ? '' : Number(e.target.value))}
                        readOnly={origenTasa !== 'MANUAL'} 
                        className={`flex-1 min-w-0 p-2.5 border border-l-0 border-slate-200 rounded-r-lg text-sm outline-none transition-all ${origenTasa !== 'MANUAL' ? 'bg-slate-50 text-slate-500' : 'bg-white text-slate-800 focus:ring-2 focus:ring-red-700'}`} 
                    />
                </div>
            </div>
        </div>
    );
};

export default SeleccionarTasa;