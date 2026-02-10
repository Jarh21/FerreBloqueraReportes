import axios from "axios";
import https from "https";
import dotenv from "dotenv"
dotenv.config();
//const https = require('https');
// Crear un agente que ignora la validación del certificado solo para desarrollo en ambientes de calidad
const httpsAgent = new https.Agent({  
  rejectUnauthorized: false
});

export const consultarSaldoBDV = async function (req, res) {

  const { empresaId } = req.params;
  // Configuración de la URL para Ambiente de Calidad 
  const URL = 'https://bdvconciliacionqa.banvenez.com:444/account/balances/v2';

  // Headers requeridos según la documentación 
  const headers = {
    'X-API-Key': process.env.BDVFBSJ, // API Key exclusiva de Calidad 
    'Content-Type': 'application/json' // 
  };

  // Cuerpo de la solicitud (JSON) 
  const data = {
    "currency": "VES", // Código de la moneda 
    "account": process.env.BDVFBSJ_AC // Número de cuenta proporcionado en el manual 
  };

  try {   
    const response = await axios.post(URL, data, { headers, httpsAgent });
    // Procesamiento de la respuesta 
    const resultado = response.data;    
    if (resultado.code === 1000) { // Código 1000 indica éxito      
      res.json(resultado); // Enviar solo la parte de datos al frontend
    } else {
      console.log(`Error del servicio: ${resultado.message}`); // 
    }

  } catch (error) {
    if (error.response) {
      console.error('Error de respuesta del servidor:', error.response.data);
    } else {
      console.error('Error al realizar la conexión:', error.message);
    }
  } 
}

export const realizarPagoMovilBDV = async function (req, res) {
  const { numeroReferencia, montoOperacion, nacionalidadDestino, cedulaDestino, telefonoDestino, bancoDestino, moneda, conceptoPago } = req.body;
  // URL del servicio 
  const url = 'https://bdvconciliacionqa.banvenez.com:444/api/consulta/consultaMultiple/v2';

  // Configuración de Headers 
  const headers = {
    'X-API-Key': process.env.BDVFBSJ, 
    'Content-Type': 'application/json' 
  };

  // Cuerpo de la solicitud (Objeto JavaScript directo para Axios) 
  const data = {
    "numeroReferencia": numeroReferencia,      
    "montoOperacion": montoOperacion,               
    "nacionalidadDestino": nacionalidadDestino,           
    "cedulaDestino": cedulaDestino,           
    "telefonoDestino": telefonoDestino,      
    "bancoDestino": bancoDestino,                
    "moneda": moneda,                        
    "conceptoPago": conceptoPago    
  };
  console.log("Datos enviados a BDV:", data); // Log para verificar los datos antes de la solicitud
  try {
   
    const response = await axios.post(url, data, { headers, httpsAgent });
    const resData = response.data;  
    console.log("Respuesta de BDV:", resData); // Log para verificar la respuesta completa
      res.json(resData); 

  } catch (error) {
    // Manejo de errores específico de Axios
    if (error.response) {       
      console.error('Error del Servidor:', error.response.data);
    } else {
      console.error('Error de Conexión:', error.message);
    }
  }
}