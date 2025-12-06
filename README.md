# 🏥 Dermatech Project

API y aplicación web para diagnóstico dermatológico asistido por IA.

## 📋 Descripción

Sistema completo para diagnóstico dermatológico que incluye:
- **Backend**: API REST con Node.js, Express y MongoDB
- **Frontend**: Aplicación web con Next.js
- **IA**: Integración con Google Generative AI para análisis de imágenes

## 🚀 Tecnologías

### Backend
- Node.js
- Express.js
- MongoDB (Atlas)
- Mongoose
- JWT para autenticación
- Cloudinary para almacenamiento de imágenes
- Google Generative AI

### Frontend
- Next.js
- TypeScript
- React

## 📁 Estructura del Proyecto

```
dermatech-project/
├── server/          # Backend API
│   ├── config/      # Configuraciones
│   ├── controllers/ # Controladores
│   ├── middleware/  # Middlewares
│   ├── models/      # Modelos de MongoDB
│   ├── routes/      # Rutas de la API
│   ├── services/    # Servicios
│   └── server.js    # Archivo principal del servidor
│
└── client/          # Frontend Next.js
    └── src/
        └── app/     # Aplicación Next.js
```

## ⚙️ Configuración

### Backend

1. Instalar dependencias:
```bash
cd server
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

3. Iniciar servidor:
```bash
npm run dev
```

El servidor correrá en `http://localhost:9000`

### Frontend

1. Instalar dependencias:
```bash
cd client
npm install
```

2. Iniciar aplicación:
```bash
npm run dev
```

La aplicación correrá en `http://localhost:3000`

## 🔐 Variables de Entorno

### Server (.env)
```
PORT=9000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GOOGLE_AI_API_KEY=...
```

## 📝 Scripts Disponibles

### Backend
- `npm start` - Inicia el servidor en producción
- `npm run dev` - Inicia el servidor en modo desarrollo con nodemon

### Frontend
- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm start` - Inicia el servidor de producción

## 🗄️ Base de Datos

El proyecto usa MongoDB Atlas. La base de datos se crea automáticamente cuando se inserta el primer documento.

## 📚 API Endpoints

(Se documentarán los endpoints aquí)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request


## 👤 Autor

Valentina Vargas Pescara

---

**Nota**: Este proyecto está en desarrollo activo.

