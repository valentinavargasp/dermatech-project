# 🏥 DermaTech Project (Full-Stack Next.js)

Aplicación web y API para diagnóstico dermatológico asistido por Inteligencia Artificial, migrada a una arquitectura monolítica Full-Stack moderna en **Next.js (App Router)**.

## 📋 Descripción

Sistema integral para diagnóstico dermatológico que unifica:
- **Frontend**: Aplicación web interactiva con **Next.js 16 (App Router)**, **React 19**, **TypeScript** y **Tailwind CSS v4**.
- **Backend (API Route Handlers)**: Endpoints RESTful integrados en `src/app/api/*` con **MongoDB (Mongoose)**, **JWT** y **Cloudinary**.
- **IA Multimodal**: Integración con **Google Gemini (`gemini-2.5-flash`)** para análisis clínico y visual de lesiones cutáneas.

## 🚀 Tecnologías

- **Framework Full-Stack**: Next.js 16 (App Router) + React 19 + TypeScript
- **Estilos**: Tailwind CSS v4
- **Base de Datos**: MongoDB Atlas + Mongoose 8
- **Autenticación**: JSON Web Tokens (`jsonwebtoken` + `bcryptjs`)
- **Almacenamiento Multimedia**: Cloudinary (`cloudinary`)
- **Inteligencia Artificial**: Google Generative AI (`@google/generative-ai`)

## 📁 Estructura del Proyecto

```
dermatech-project/
├── public/
│   └── uploads/              # Íconos e imágenes estáticas
├── src/
│   ├── app/
│   │   ├── api/              # Route Handlers (Backend API)
│   │   │   ├── auth/         # /api/auth/login, /api/auth/perfil, /api/auth/logout
│   │   │   ├── afecciones/   # /api/afecciones y /api/afecciones/[id]
│   │   │   ├── sintomas/     # /api/sintomas y /api/sintomas/[id]
│   │   │   ├── consultas/    # /api/consultas, /api/consultas/recientes y /api/consultas/[id]
│   │   │   └── estadisticas/ # /api/estadisticas y /api/estadisticas/severidad
│   │   ├── login/            # Pantalla de Inicio de Sesión
│   │   ├── dashboard/        # Panel Principal y Estadísticas
│   │   ├── consulta/         # Wizard de Diagnóstico en 3 pasos
│   │   ├── resultado/        # Resultado de Consulta + Análisis IA
│   │   ├── afecciones/       # Listado, Detalle ([id]) y Formulario de Afecciones
│   │   └── sintomas/         # Gestión CRUD de Síntomas
│   ├── components/           # Componentes reutilizables (Navbar, ImageModal)
│   ├── context/              # Estado global de sesión, cliente API y notificaciones
│   ├── lib/                  # Conexión MongoDB, Seed, Auth JWT, Cloudinary y Gemini
│   └── models/               # Modelos Mongoose (Usuario, Afeccion, Sintoma, Consulta)
├── next.config.ts
├── package.json
└── tsconfig.json
```

## ⚙️ Configuración y Ejecución Local

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno (`.env.local`):**
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GOOGLE_AI_API_KEY=...
```

3. **Iniciar el servidor de desarrollo:**
```bash
npm run dev
```

La aplicación y la API correrán unificadas en `http://localhost:3000`.

## ☁️ Despliegue en Vercel

Al ser una aplicación Next.js Full-Stack en la raíz del repositorio:
1. Importa el repositorio `dermatech-project` en Vercel.
2. Configura las variables de entorno (`MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*`, `GOOGLE_AI_API_KEY`) en el panel de Vercel.
3. Haz clic en **Deploy** (no requiere configuraciones adicionales ni `vercel.json`).

## 👤 Autor

Valentina Vargas Pescara
