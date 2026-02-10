import axios from "axios";
import https from "https";
import dotenv from "dotenv"
dotenv.config();

// 1. Agente para ignorar validaciones SSL en ambiente de desarrollo 
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

//obetenmos la ip del servidor
import os from 'os';
const interfaces = os.networkInterfaces();
let serverIP = '';
for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    if (iface.family === 'IPv4' && !iface.internal) {
      serverIP = iface.address;
    }
    }
}

// Configuración inicial (debes actualizar con tus credenciales y URLs)
const config = {
  consumerKey: 'j2ikPx_fQ_XiqLrgEc57TFw88FYa',
  consumerSecret: 'OKseRM5f5P_8nWp8pE7kR4mmKi8a',
  tokenUrl: 'https://openbanking-desa:9443/oauth2/token',
  listarBancosUrl: 'https://openbanking-desa:8243/ListarBanco/1.0.0/listarBancosApi',
  sendPaymentUrl: 'https://openbanking-desa:8243/PaP/1.0.0/sendPaymentB2P',
  consultarSaldoBancaribeUrl: 'https://openbanking-desa:8243/Cuentas/ConsultaSaldos/1.0.0/ctas ConsultaSaldos'
};

// Variables para manejo de token en memoria
let accessToken = null;
let tokenExpiresAt = null;

// Función para obtener token de acceso OAuth2 client_credentials
async function getAccessToken() {
  const now = new Date();

  // Si el token existe y no ha expirado, retornarlo
  if (accessToken && tokenExpiresAt && now < tokenExpiresAt) {
    return accessToken;
  }

  // Construir la cabecera Authorization Basic con consumerKey:consumerSecret en base64
  const credentials = `${config.consumerKey}:${config.consumerSecret}`;
  const encodedCredentials = Buffer.from(credentials).toString('base64');

  try {
    const response = await axios.post(
      config.tokenUrl,
      new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
      {
        headers: {
          Authorization: `Basic ${encodedCredentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        httpsAgent,
      }
    );

    accessToken = response.data.access_token;
    // Calcular tiempo de expiración (ahora + expires_in segundos menos 1 minuto de margen)
    tokenExpiresAt = new Date(now.getTime() + (response.data.expires_in - 60) * 1000);

    return accessToken;
  } catch (error) {
    throw new Error(`Error obteniendo token de acceso: ${error.response?.data || error.message}`);
  }
}

// Función para llamar al servicio listarBancosApi
export const listarBancosApi = async (requestData) => {
  try {
    const token = await getAccessToken();

    const response = await axios.post(
      config.listarBancosUrl,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        httpsAgent,
      }
    );

    return response.data;
  } catch (error) {
    // Manejo básico de error
    throw new Error(`Error en listarBancosApi: ${error.response?.data || error.message}`);
  }
}

// 2. Mapeo de errores 
const ERRORS_BANCARIBE = {
  '80049': 'Debe indicar cédula / RIF.',
  '103000': 'El cliente no existe en los registros.',
  '701114': 'Cédula errada.',
  '101042': 'Cédula errada.',
  '201025': 'La moneda no corresponde a la cuenta.',
  '101032': 'Seleccione el producto correspondiente.',
  '101128': 'La cuenta no está vigente.',
  '201004': 'La cuenta registrada no existe.'
};

/**
 * Flujo completo de integración Bancaribe
 */
export const consultarSaldoBancaribe = async (req, res) => {
  try {
   
    // --- Realizar la Consulta de Saldo ---
    const urlSaldo = config.consultarSaldoBancaribeUrl; 

    const requestData = {
      "canal": "API", // Valor fijo según el manual 
      "clienteRIF": "J000666652", // RIF del cliente jurídico
      "clienteHash": "09A2D57E-C433-4581-97C2-6F6ADA944F27", // Hash asignado
      "numeroCuenta": "01140111122222233333", // Número de cuenta o null para todas 
      "requestIP": serverIP // IP del cliente que realiza la petición 
    };

    const response = await axios.post(urlSaldo, requestData, {
      httpsAgent,
      headers: {
        'Authorization': `Bearer ${accessToken}`, // Token Bearer obtenido
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    //Mostrar saldos (Disponible, Contable y Bloqueado)
    res.json(response.data);
    console.log('--- Saldo Obtenido ---');
    console.log(`Cuenta: ${response.data.producto.numeroCuenta}`);
    console.log(`Disponible: ${response.data.saldo.disponible} ${response.data.moneda.codigo}`);
    console.log(`Contable: ${response.data.saldo.contable}`);
    if (response.data.saldo.bloqueado !== undefined) {
      console.log(`Bloqueado: ${response.data.saldo.bloqueado}`);
    }

  } catch (error) {
    if (error.response) {
      // Manejo de errores específicos del banco
      const errorCode = error.response.data.code || error.response.status;
      const mensaje = ERRORS_BANCARIBE[errorCode] || error.response.data.message || 'Error desconocido';
      
      console.error(`Error Bancaribe (${errorCode}): ${mensaje}`);
    } else {
      console.error('Error de Conexión:', error.message);
    }
  }
}

export const ejecutarPagoMovilBancaribe = async (req,res) => {
    try {
    const token = await getAccessToken();
    const datosFormulario = 
    {
    "montoTransaccion": "5.00",
    "bancoCredito": "0114",
    "canalVirtual": "1",
    "oficina": 800,
    "identificadorPersona": "V12345114",
    "telefonoCredito": "04141234114",
    "vendedor": 2525,
    "concepto": "Prueba PaP",
    "direccionInternet": "192.169.0.12",
    "bancoPagador": "0114",
    "cajaTerminal": 1,
    "codigoMoneda": 928,
    "nombreComercio": "Comercial Pruebas",
    "rif": "J000012114",
    "sucursal": 1,
    "telefonoDebito": "04141000114",
    "tipoTerminal": "WEB",
    "factura": "0"
    };    
    const response = await axios.post(
      config.sendPaymentUrl,
      datosFormulario,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        httpsAgent,
      }
    );

    return response.data;
  } catch (error) {
    // Manejo básico de error
    throw new Error(`Error en sendPaymentB2P: ${error.response?.data || error.message}`);
  }
}