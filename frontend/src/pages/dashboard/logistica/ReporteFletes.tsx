import { useEffect,useState } from "react";
import { buildApiUrl } from "../../../config/api";
import axios from "axios";
import { Toaster, toast } from 'sonner';
import { useAuth } from "../../../context/AuthContext";

const ReporteFletes : React.FC = ()=> {

    return(
        <div>
            <h1>Reporte de Fletes</h1>
        </div>
    );
}
export default ReporteFletes;