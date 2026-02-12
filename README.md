# Grupo San Juan - Sistema de Gestión Empresarial

Sistema completo de gestión para ferretería con autenticación, roles, permisos y múltiples empresas.

## Estructura del Proyecto

\`\`\`
proyecto/
├── backend/                # API Express
│   ├── src/
│   │   ├── modules/        # Módulos: auth, usuarios, empresas, finanzas, reportes
│   │   ├── middleware/
│   │   ├── config/
|   |   ├── routes/routes.js
│   │   └── index.js   
│   ├── .env
│   └── package.json
├── frontend/               # App React + Vite
│   ├── public/image/       #imagenes publicas del frontend
│   ├── src/
│   │   ├── pages/          # Páginas: Login, Register, Dashboard
│   │   ├── components/
│   │   ├── config/api.ts   #generador de url hacia el backend
│   │   ├── context/AuthContext.tsx
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   └── main.tsx        # raiz del frontend + importa App.tsx
│   ├── vite.config.ts
│   ├── tsconfig.json       # configuracion de typescrit
│   ├── tailwind.config.js  #configuracion del tailwind
│   ├── index.html
│   └── package.json
├── database.sql            # Schema MySQL
└── README.md
\`\`\`

## Requisitos

- Node.js 24+
- MySQL 8.0+
- npm o yarn

## Instalación

### 1. Base de Datos

Importa el archivo `database.sql` en tu cliente MySQL:

\`\`\`bash
mysql -u root -p < database.sql
\`\`\`

### 2. Backend

\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`

El servidor iniciará en `http://localhost:3001`

### 3. Frontend

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

La aplicación estará disponible en `http://localhost:5173`

## Credenciales de Demostración

**Admin:**
- Email: admin@gruposanjuan.com
- Contraseña: admin123

**Usuario Normal:**
- Email: juan@gruposanjuan.com
- Contraseña: usuario123

## Características

- ✅ Autenticación con sesiones y cookies
- ✅ Control de roles y permisos
- ✅ Gestión de múltiples empresas
- ✅ Dashboard con sidebar acordión
- ✅ Módulos: Finanzas, Reportes, Configuración
- ✅ Tema profesional con colores suaves (amarillo y rojo)
- ✅ Contraseñas encriptadas con bcrypt
- ✅ Diseño responsive

## Módulos

### Público
- Login
- Registro

### Usuario Normal
- Inicio (Dashboard)
- Finanzas (Arqueo de caja)
- Reportes (Proveedores, Ventas, Saldos)

### Admin
- Todos los módulos del usuario normal
- Configuración (Usuarios, Roles, Empresas)

## API Endpoints

\`\`\`
POST   /api/auth/registro
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/usuarios
POST   /api/usuarios
PUT    /api/usuarios/:id
DELETE /api/usuarios/:id

GET    /api/empresas
GET    /api/empresas/usuario/mis-empresas
POST   /api/empresas
PUT    /api/empresas/:id

GET    /api/finanzas/:empresaId
POST   /api/finanzas

GET    /api/reportes/proveedores/:empresaId
GET    /api/reportes/ventas/:empresaId
GET    /api/reportes/saldos/:empresaId
\`\`\`

## Notas Importantes

- Las contraseñas se encriptan con bcrypt (10 salts)
- Las sesiones se almacenan en cookies HTTPOnly
- Todos los endpoints requieren autenticación
- El admin tiene acceso a todos los módulos
- Los usuarios normales solo ven sus empresas asignadas

## Soporte

Para más información, contacta al equipo de desarrollo.
