import {pool, ejecutarConsultaEnEmpresaPorId} from "../../config/database.js"
import { GoogleGenAI } from "@google/genai";

export const obtenerRespuestaChatbot = async (req, res) => {
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const { empresaId, pregunta } = req.body;

    if (!GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY no está definida')
        return res.status(500).json({ error: 'Servidor sin configuración de AI.' })
    }

    // util: sleep
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

    // util: generar contenido con reintentos en caso de 503/UNAVAILABLE u otros errores transitorios
    const generateWithRetries = async (ai, options, attempts = 3, delay = 700) => {
        let lastErr = null
        for (let i = 0; i < attempts; i++) {
            try {
                return await ai.models.generateContent(options)
            } catch (err) {
                lastErr = err
                const status = err?.status || err?.response?.status || (err?.error && err.error.code)
                console.warn(`Intento ${i + 1} falló (status=${status}).`)
                // Si es final (4xx distinto a 429) no reintentamos
                if (status && status >= 400 && status < 500 && status !== 429 && status !== 503) break
                // Exponencial backoff
                const wait = delay * Math.pow(2, i)
                await sleep(wait)
            }
        }
        throw lastErr
    }

    // 1. Definimos el esquema de tus tablas (esto es lo que la IA necesita saber)
    const dbSchema = `
        Tabla: facturas (keycodigo,documento, fecha, nomclie, rif,gravado, exento, total, fiscalcomp,usuario)
        Tabla: facturas_dat(keycodigo,documento,fecha,codprod,nombre,cantidad,costo,precio,total,totalmasiva,almacen,equipo)
        clave foranea: facturas_dat.documento -> facturas.documento
        alias: facturas as f, facturas_dat as fd
        descripcion de campos:
        - keycodigo: ID único de la factura
        - documento: codigo de relacion entre facturas y facturas_dat
        - fecha: fecha de la factura
        - nomclie: nombre del cliente
        - rif: rif del cliente
        - codprod: código del producto
        - nombre: nombre del producto
        - totalmasiva: total mas impuestos de la linea (cantidad * precio + impuestos)
        
    `;

    // 2. Creamos el prompt
    const prompt = `
        Actúa como un experto en SQL para MySQL.
        Basado en este esquema: ${dbSchema}
        Genera una consulta SQL para responder: "${pregunta}"
        Utiliza alias cuando sea necesario.
        REGLAS:
        - Retorna SOLO el código SQL, sin bloques de código markdown, sin explicaciones.
        - Las consultas deben ser de solo lectura (SELECT).
    `;
    
    const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
    let result
    try {
        result = await generateWithRetries(ai, { model: "gemini-3-flash-preview", contents: prompt }, 3, 500)
    } catch (err) {
        console.error('Error al generar consulta SQL desde la API de AI:', err)
        return res.status(503).json({ error: 'El servicio de generación de IA no está disponible. Intenta más tarde.' })
    }

    const sqlQuery = result.text.trim()
    console.log("Consulta SQL generada por IA:", sqlQuery);
    // 3. Ejecución segura en el Backend
    try {
        // Aquí usas tu conexión a MySQL (ejemplo con Knex)
        const data = await ejecutarConsultaEnEmpresaPorId(empresaId,sqlQuery);

        // 2. Creamos un prompt que combine la pregunta y los datos reales
        const promptRespuesta = `
            Eres el asistente virtual de la ferretería "Grupo San Juan" y te llamas juanito. 
            El usuario hizo esta pregunta: "${pregunta}"
            
            Los datos reales obtenidos de la base de datos en formato JSON son:
            ${JSON.stringify(data)}

            Por favor, redacta una respuesta basada en esos datos.
            - Si los datos están vacíos, indica que no se encontró información.
            - Usa un tono servicial.
            - No menciones que eres una IA o que recibiste un JSON.
        `;
        console.log("Resultado de datos para la respuesta:", data);
        let resultRespuesta
        try {
            console.log("promptRespuesta: ",promptRespuesta)
            resultRespuesta = await generateWithRetries(ai, { model: "gemini-3-flash-preview", contents: promptRespuesta }, 3, 500)
        } catch (err) {
            console.error('Error al generar respuesta final desde la API de AI:', err)
            return res.status(503).json({ error: 'El servicio de IA está sobrecargado. Intenta nuevamente más tarde.' })
        }

        const respuestaText = (resultRespuesta?.text || resultRespuesta?.outputText || JSON.stringify(resultRespuesta) || '').toString()
        // Enviamos objeto con texto para fácil consumo por frontend
        return res.json({ text: respuestaText })
    } catch (error) {
        console.error("Hubo un problema al procesar la consulta.", error);
        res.status(500).json({ error: "Hubo un problema al procesar la consulta." });
    }
}