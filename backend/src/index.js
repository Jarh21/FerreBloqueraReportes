import express from "express"
import session from "express-session"
import cors from "cors"
import dotenv from "dotenv"
import routes from "./routes/routes.js"
import path from 'path';
import { fileURLToPath } from 'url';
// 1. IMPORTAMOS LIBRERÍAS NECESARIAS
import { createServer } from 'node:http'; 
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config()

const app = express()

// 2. CREAMOS EL SERVIDOR HTTP Y ATAMOS SOCKET.IO
const httpServer = createServer(app); 

const allowedOrigins = [  
  process.env.FRONTEND_URL,
  "http://10.10.1.186:3010",
  "http://10.10.1.186:80",
];

// Configuración de CORS para Express (HTTP)
app.use(cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error('CORS no permitido'), false);
      }
      return callback(null, true);
    },
    credentials: true,
}));

// 3. CONFIGURACIÓN DE CORS PARA SOCKET.IO (Es independiente)
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins, // Usa el mismo array de dominios
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Detectar conexiones (Opcional, para debug)
io.on('connection', (socket) => {
    console.log('⚡ Nuevo cliente conectado via Socket:', socket.id);
});

// 4. MIDDLEWARE CLAVE: Inyectar 'io' en cada petición (req)
// Esto permite usar req.io.emit() dentro de tus controladores
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
)

app.use("/api", routes)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: "Error interno del servidor" })
})

const PORT = process.env.PORT || 4500
// 5. CAMBIO IMPORTANTE: Escuchamos con 'httpServer', NO con 'app'
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor Socket+Express ejecutándose en puerto ${PORT}`)
})

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads/')));