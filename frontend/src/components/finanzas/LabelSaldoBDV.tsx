import {useEffect,useState} from "react";
import axios from "axios";
import { buildApiUrl } from "../../config/api";


type LabelSaldoBDVPorps = {
    empresaid:string | number;
};

const LabelSaldoBDV: React.FC<LabelSaldoBDVPorps> = ({empresaid}) => {
  
  const [saldoBDV, setSaldoBDV] = useState<string>("");
  const [empresaIdState, setEmpresaIdState] = useState<string>("");
    const handleSaldoBDV = async () => {
        try {
            const response = await axios.get(buildApiUrl(`/bancos/bdv/saldo/${empresaid}`), {withCredentials: true,});
            console.log('Saldo BDV:', response);
            setSaldoBDV(response.data.ppalSdoFinal);
           
        } catch (err) {
            console.error('Error al consultar saldo BDV:', err);
        }
    };
    useEffect(() => {
      handleSaldoBDV();
    }, [empresaid]);
    return (
        <label htmlFor="">{saldoBDV}</label>
    );
  

}
export default LabelSaldoBDV;

