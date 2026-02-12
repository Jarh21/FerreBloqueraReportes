import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

// Inicializamos el cliente
const client = new Client({
    authStrategy: new LocalAuth(), // Guarda la sesión para no escanear el QR cada vez
    puppeteer: { 
        args: ['--no-sandbox'], // Necesario para servidores Linux/VPS
    }
});

// Evento: Generar QR
client.on('qr', (qr) => {
    console.log('Estimate user, ESCANEA ESTE QR CON TU WHATSAPP PARA INICIAR EL BOT:');
    qrcode.generate(qr, { small: true });
});

// Evento: Conectado
client.on('ready', () => {
    console.log('✅ Cliente de WhatsApp listo y conectado!');
});

// Evento: Error de Autenticación
client.on('auth_failure', msg => {
    console.error('❌ Error de autenticación en WhatsApp:', msg);
});

// Inicializar
client.initialize();

// --- FUNCIÓN PARA ENVIAR MENSAJES ---
export const enviarMensaje = async (numero, mensaje) => {
    try {
        // 1. Formatear número (Solo para Venezuela como ejemplo)
        // Convertir "04121234567" -> "584121234567@c.us"
        let numeroFinal = numero.replace(/\D/g, ''); // Quitar guiones o espacios
        
        if (numeroFinal.startsWith('0')) {
            numeroFinal = '58' + numeroFinal.substring(1);
        } else if (numeroFinal.startsWith('4')) { // Si viene sin el 0 (ej: 412...)
            numeroFinal = '58' + numeroFinal;
        }

        // Validación básica de longitud (Venezuela son 10 u 11 dígitos aprox)
        if (numeroFinal.length < 10) {
            console.warn(`⚠️ Número inválido para WhatsApp: ${numero}`);
            return;
        }

        const chatId = `${numeroFinal}@c.us`;

        // 2. Verificar si el número tiene WhatsApp
        const isRegistered = await client.isRegisteredUser(chatId);
        if (!isRegistered) {
            console.warn(`⚠️ El número ${numero} no está registrado en WhatsApp.`);
            return;
        }

        // 3. Enviar
        await client.sendMessage(chatId, mensaje);
        console.log(`📨 Mensaje enviado a ${numero}`);

    } catch (error) {
        console.error("Error enviando WhatsApp:", error);
    }
};