import axios from "axios";
import dotenv from "dotenv"
dotenv.config();

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
    const response = await axios.post(URL, data, { headers });
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
  // URL del servicio para ambiente de calidad [cite: 73]
  const url = 'https://bdvconciliacionqa.banvenez.com:444/api/consulta/consultaMultiple/v2';

  // Configuración de Headers según el manual técnico [cite: 75]
  const headers = {
    'X-API-Key': '256D0FDD36F1B1B3F1208A9B6EC693', // API Key exclusiva de QA [cite: 75]
    'Content-Type': 'application/json' // Formato de entrada JSON [cite: 75]
  };

  // Cuerpo de la solicitud (Objeto JavaScript directo para Axios) 
  const data = {
    "numeroReferencia": numeroReferencia,      // Generado por el comercio [cite: 84]
    "montoOperacion": montoOperacion,               // Importe con punto decimal [cite: 84, 113]
    "nacionalidadDestino": nacionalidadDestino,            // Nacionalidad del receptor [cite: 84]
    "cedulaDestino": cedulaDestino,           // Cédula del receptor [cite: 84]
    "telefonoDestino": telefonoDestino,      // Teléfono del receptor [cite: 84]
    "bancoDestino": bancoDestino,                // Código del banco destino [cite: 84]
    "moneda": moneda,                        // Moneda de la operación [cite: 84]
    "conceptoPago": conceptoPago    // Descripción del pago [cite: 84]
  };

  try {
    // Axios realiza el POST y la conversión a JSON automáticamente [cite: 72, 75]
    const response = await axios.post(url, data, { headers });

    // En Axios, la respuesta del servidor está en la propiedad 'data'
    const resData = response.data;  
    
      res.json(resData); // Enviar la respuesta completa al frontend para mostrar detalles  

  } catch (error) {
    // Manejo de errores específico de Axios
    if (error.response) {
      // El servidor respondió con un código fuera del rango 2xx (ej. 400 por error de validación) [cite: 123]
      console.error('Error del Servidor:', error.response.data);
    } else {
      console.error('Error de Conexión:', error.message);
    }
  }
}