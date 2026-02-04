// src/config/api.ts

// 1. Recuperamos la URL base si ya existe en el .env (para producción estricta)
const ENV_API_URL = import.meta.env.VITE_API_URL;

// 2. Lógica Dinámica de Host
const protocol = window.location.protocol; 
const hostname = window.location.hostname;

// AQUI ESTÁ EL CAMBIO:
// Buscamos la variable VITE_BACKEND_PORT. Si no existe, usamos 4500.
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || 4500;

// 3. Construcción Inteligente
// Si en el .env definiste una URL completa (ej: https://mi-api.com), usamos esa.
// Si no, la construimos dinámicamente con el hostname del navegador + el puerto configurado.
export const SERVER_URL = ENV_API_URL 
    ? new URL(ENV_API_URL).origin // Extrae "https://mi-api.com" de la URL completa
    : `${protocol}//${hostname}:${BACKEND_PORT}`;

// 4. Definimos la base de la API
// Si ENV_API_URL existe, úsala tal cual. Si no, constrúyela.
const API_BASE_URL = ENV_API_URL || `${SERVER_URL}/api`;

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
};

// Función para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
};