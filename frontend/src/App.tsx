import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes";
import React, { useEffect } from 'react';
import { Toaster, toast } from 'sonner'; // Importamos toast también
import io from 'socket.io-client'; // Importamos el cliente
import { buildApiUrl } from './config/api';
// Conectamos al backend (Asegúrate de que la URL sea correcta)
const socket = io(buildApiUrl('/'), {
    withCredentials: true,
    autoConnect: true
});

export default function App() {

  useEffect(() => {
      // 1. Escuchar el evento que creamos en el backend
      socket.on('nueva_solicitud', (data: any) => {
          
          // 2. Reproducir un sonidito (Opcional pero recomendado)
          const audio = new Audio('/notificacion.mp3'); // Debes poner un archivo mp3 en tu carpeta public
          audio.play().catch(e => console.log("Audio bloqueado por navegador"));

          // 3. Mostrar el Toast Bonito
          toast.info("🔔 Nueva Solicitud Recibida", {
              description: `${data.mensaje}. Monto: ${data.monto} ${data.moneda}`,
              duration: 8000, // Que dure bastante
              action: {
                  label: "Ver",
                  onClick: () => window.location.href = "/consultas" // O navegar a la vista
              }
          });
      });

      // Limpieza al desmontar (aunque App rara vez se desmonta)
      return () => {
          socket.off('nueva_solicitud');
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