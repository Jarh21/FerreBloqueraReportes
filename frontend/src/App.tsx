import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes";
import React, { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import io from 'socket.io-client'; 

// 1. IMPORTANTE: Importamos SERVER_URL (La raíz), NO buildApiUrl
import { SERVER_URL } from "./config/api"; 

// 2. CORRECCIÓN: Usamos SERVER_URL para el socket
const socket = io(SERVER_URL, {
    withCredentials: true,
    autoConnect: true,
    transports: ['websocket', 'polling'] // Opcional: ayuda a la compatibilidad
});

export default function App() {

  useEffect(() => {
      // Debuggers para ver si conecta en la consola del navegador (F12)
      socket.on('connect', () => console.log("🟢 Socket Conectado con ID:", socket.id));
      socket.on('connect_error', (err) => console.error("🔴 Error conexión Socket:", err.message));

      socket.on('nueva_solicitud', (data: any) => {
          
          // Audio
          try {
             const audio = new Audio('/notificacion.mp3'); 
             audio.play().catch(e => console.log("Audio bloqueado (falta interacción)"));
          } catch(e) {}

          // Toast
          toast.info("🔔 Nueva Solicitud Recibida", {
              description: `${data.mensaje}. Monto: ${data.monto} ${data.moneda}`,
              duration: 80000000, 

              /* action: {
                
                label: "Ver",
                  onClick: () => window.location.href = "/dashboard/solicitudes/consulta" 
              } */

          });
      });

      return () => {
          socket.off('nueva_solicitud');
          socket.off('connect');
          socket.off('connect_error');
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