import React from 'react';
import axios from "axios";
import { buildApiUrl } from '../../config/api';
import { useAuth } from "../../context/AuthContext";

interface TipoMoneda {
    keycodigo: number;    
    abreviatura: string;
    valor: number;
    tipoMoneda:number;
    nacional:number;
}

interface SeleccionarTasaProps {
    value?: number | '';
    selectedId?: number | string | null; // Nueva prop para forzar selección desde afuera
    onChange?: (value: number | '', origen: string) => void;
}

const SeleccionarTasa: React.FC<SeleccionarTasaProps> = ({ value, selectedId, onChange }) => {
    const { empresaActual } = useAuth();
    const [tipoMoneda, setTipoMoneda] = React.useState<TipoMoneda[]>([]);
    const [origenTasa, setOrigenTasa] = React.useState<string>('');
    const [tasaValor, setTasaValor] = React.useState<number | ''>(value ?? '');

    // 1. Cargar datos (Solo al montar o cambiar empresa)
    React.useEffect(() => {
        if (empresaActual?.id) {
            axios.get(buildApiUrl(`/finanzas/tipo-moneda/${empresaActual?.id}`), { withCredentials: true })
                .then(res => setTipoMoneda(res.data));
        }
    }, [empresaActual?.id]);

    // 2. Reaccionar a la señal del padre (selectedId) sin disparar onChange
    React.useEffect(() => {
        if (selectedId && tipoMoneda.length > 0) {
            const moneda = tipoMoneda.find(m => m.keycodigo.toString() === selectedId.toString());
            if (moneda) {
                const nuevoOrigen = moneda.keycodigo.toString();
                const nuevoValor = Number(moneda.valor);
                const cambioOrigen = nuevoOrigen !== origenTasa;
                const cambioValor = nuevoValor !== tasaValor;

                if (cambioOrigen) setOrigenTasa(nuevoOrigen);
                if (cambioValor) setTasaValor(nuevoValor);

                if ((cambioOrigen || cambioValor) && onChange) {
                    onChange(nuevoValor, nuevoOrigen);
                }
            }
        }
    }, [selectedId, tipoMoneda, origenTasa, tasaValor, onChange]);

    // 3. Manejador de cambios del Usuario (Aquí SÍ notificamos al padre)
    const handleManualChange = (nuevaTasaId: string) => {
        setOrigenTasa(nuevaTasaId);
        if (nuevaTasaId === 'MANUAL') {
            setTasaValor('');
            if (onChange) onChange('', 'MANUAL');
        } else {
            const moneda = tipoMoneda.find((m) => m.keycodigo.toString() === nuevaTasaId);
            const nuevoValor = moneda ? Number(moneda.valor) : '';
            setTasaValor(nuevoValor);
            if (onChange) onChange(nuevoValor, nuevaTasaId);
        }
    };

    return (
        <div className="w-full">
            <div className="flex w-full">
                <select
                    value={origenTasa}
                    onChange={(e) => handleManualChange(e.target.value)}
                    className="bg-slate-100 border border-slate-200 text-xs font-bold rounded-l-lg px-2 py-2"
                >
                    {tipoMoneda.map((moneda) => (
                        <option key={moneda.keycodigo} value={moneda.keycodigo}>
                            {moneda.abreviatura}
                        </option>
                    ))}
                    <option value="MANUAL">Manual</option>
                </select>
                <input 
                    type="number" 
                    value={tasaValor}
                    onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setTasaValor(val);
                        if (onChange) onChange(val, origenTasa);
                    }}
                    readOnly={origenTasa !== 'MANUAL'} 
                    className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-r-lg px-2 py-3 w-full text-right" 
                />
            </div>
        </div>
    );
};

export default SeleccionarTasa;