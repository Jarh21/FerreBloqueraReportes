import express from "express"
import session from "express-session"
import cors from "cors"
import dotenv from "dotenv"
import routes from "./routes/routes.js"

dotenv.config()

const app = express()

//listado de dominios permitidos para CORS    
const allowedOrigins = [  
  process.env.FRONTEND_URL,
  "10.10.1.186:3010",
  "10.10.1.186:80",
  // Puedes agregar más orígenes aquí
];
app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir solicitudes sin origen (como mobile apps o curl requests)
      console.log("Origin:", origin,);
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'El origen CORS no está permitido';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
//app.use(cors());
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

// Rutas
app.use("/api", routes)


// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: "Error interno del servidor" })
})

const PORT = process.env.PORT 
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`)
})
