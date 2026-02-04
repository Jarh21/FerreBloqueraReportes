import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes";
import React, { useEffect } from 'react';
import { Toaster, toast } from 'sonner'; 
import io from 'socket.io-client'; 

// 1. IMPORTA SERVER_URL (NO buildApiUrl)
// Asegúrate de haber exportado 'SERVER_URL' en tu archivo src/config/api.ts como acordamos
import { SERVER_URL } from "./config/api"; 

// 2. CORRECCIÓN AQUÍ: Usamos la raíz del servidor
const socket = io(SERVER_URL, {
    withCredentials: true,
    autoConnect: true
});

export default function App() {

  useEffect(() => {
      // (Debug opcional) Para ver si conecta
      socket.on('connect', () => console.log("🟢 Socket Conectado:", socket.id));
      socket.on('connect_error', (err) => console.error("🔴 Error Socket:", err));

      // 1. Escuchar el evento
      socket.on('nueva_solicitud', (data: any) => {
          
          // 2. Sonido (Asegúrate que el archivo exista en la carpeta /public)
          try {
             const audio = new Audio('/notificacion.mp3'); 
             audio.play().catch(e => console.log("Audio bloqueado (interacción requerida)"));
          } catch(e) {}

          // 3. Toast
          toast.info("🔔 Nueva Solicitud Recibida", {
              description: `${data.mensaje}. Monto: ${data.monto} ${data.moneda}`,
              duration: 8000, 
              action: {
                  label: "Ver",
                  onClick: () => window.location.href = "/consultas" 
              }
          });
      });

      return () => {
          socket.off('nueva_solicitud');
          socket.off('connect');     // Limpieza extra
          socket.off('connect_error'); // Limpieza extra
      };
  }, []);

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </>
  );
}