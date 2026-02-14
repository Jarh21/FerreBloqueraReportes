import Tesseract from 'tesseract.js';

/**
 * Lee una imagen y extrae todo el texto usando Tesseract.js
 * @param imagen File o URL (blob) de la imagen
 * @returns String con el texto extraído
 */
export const leerTextoDeImagen = async (imagen: File | string) => {
    try {
        console.log("🔍 Iniciando OCR... analizando imagen...");
        
        // Ejecutamos Tesseract en español ('spa')
        const { data: { text } } = await Tesseract.recognize(
            imagen,
            'spa', 
            { 
                // Esto nos muestra una barra de progreso en la consola (opcional)
                logger: m => {
                    if (m.status === 'recognizing text') {
                        console.log(`⏳ Progreso OCR: ${(m.progress * 100).toFixed(0)}%`);
                    }
                } 
            }
        );

        console.log("✅ OCR Terminado. Texto extraído:\n", text);
        return text;

    } catch (error) {
        console.error("❌ Error en OCR:", error);
        return null;
    }
};

// src/utils/ocrService.ts (Añadir debajo de leerTextoDeImagen)

/**
 * Busca patrones comunes de referencias bancarias en el texto extraído
 */
export const extraerReferencia = (texto: string): string | null => {
    // 1. Buscamos palabras clave seguidas de números (Ref, Referencia, Operación, Recibo)
    // Tolera espacios, dos puntos, puntos o guiones entre la palabra y el número.
    const matchRef = texto.match(/(?:ref(?:erencia)?|operaci[oó]n|recibo|comprobante|nro)[\s:.\-#]*(\d{4,15})/i);
    
    if (matchRef && matchRef[1]) {
        // Retornamos los últimos 6 dígitos (que es el estándar que se suele exigir)
        return matchRef[1]; 
    }

    // 2. Plan B: Si no encontró la palabra clave, buscamos la secuencia de números más larga (mínimo 6 dígitos)
    // Esto funciona muy bien para Pago Móvil donde a veces solo sale el número gigante.
    const numerosLargos = texto.match(/\b\d{6,15}\b/g);
    if (numerosLargos) {
        // Tomamos el último número largo que encuentre (suele estar al final del recibo)
        const posibleRef = numerosLargos[numerosLargos.length - 1];
        return posibleRef;
    }

    return null; // Si no encontró nada útil
};