const API_BASE_URL = import.meta.env.VITE_API_URL ;

//esto es para obtener las notificaciones push
/*const protocol = window.location.protocol; 
const hostname = window.location.hostname;
const BACKEND_PORT = 4500;

export const SERVER_URL = `${protocol}//${hostname}:${BACKEND_PORT}`;
*/
export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
};

// Función para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

