import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    // Esto hace que Vite escuche en todas las interfaces de red
    host: '0.0.0.0',
    port: 3010,
    strictPort: true,
    // Configuración para desarrollo
    cors: true,
  },
})
