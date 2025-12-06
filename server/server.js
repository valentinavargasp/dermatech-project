import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

//Cargar variables de entorno
dotenv.config();

// ============================================
// INICIALIZAR SERVIDOR EXPRESS
// ============================================

const app = express();

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

// Configuración de CORS
// Permite que el frontend se comunique con este servidor
const corsOptions = {
    origin: function (origin, callback) {
        // Lista de orígenes permitidos
        const allowedOrigins = [
            "http://localhost:3000",
            process.env.FRONTEND_URL, 
        ].filter(Boolean);

        if (!origin || process.env.NODE_ENV === "development") {
            callback(null, true);
        } else if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("No permitido por CORS"));
        }
    },
    credentials: true, // Permite enviar cookies y headers de autenticación
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Express.json(): Permite que Express entienda JSON en el body de las peticiones
app.use(express.json());

// Permite recibir datos de formularios HTML
// extended: true permite objetos anidados en los datos
app.use(express.urlencoded({ extended: true }));

// ============================================
// CONECTAR A MONGODB
// ============================================

const MONGODB_URI = process.env.MONGODB_URI;

mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log("Conectado a MongoDB exitosamente");
    })
    .catch((error) => {
        console.error("Error al conectar a MongoDB:", error.message);
        // Si no puede conectar a la BD, no tiene sentido que el servidor siga corriendo
        process.exit(1);
    });

// ============================================
// ROUTES
// ============================================
// Ejemplo de las rutas:
// import authRoutes from "./routes/auth.routes.js";
// import userRoutes from "./routes/user.routes.js";
// import diagnosisRoutes from "./routes/diagnosis.routes.js";

// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/diagnosis", diagnosisRoutes);

// Ruta de prueba para verificar que el servidor funciona
app.get("/", (req, res) => {
    res.json({
        message: "Servidor Dermatech API funcionando correctamente",
        status: "OK"
    });
});

// ============================================
// MANEJO DE ERRORES
// ============================================
// Si una ruta no existe o hay un error, manejarlo
// de forma elegante en lugar de que el servidor crashee

// Middleware para rutas no encontradas (404)
app.use((req, res) => {
    res.status(404).json({
        error: "Ruta no encontrada",
        path: req.originalUrl
    });
});

// Middleware para manejar errores globales
app.use((err, req, res, next) => {
    console.error(" Error:", err);
    res.status(err.status || 500).json({
        error: err.message || "Error interno del servidor",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
});

// ============================================
// INICIAR EL SERVIDOR
// ============================================

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Entorno: ${process.env.NODE_ENV || "development"}`);
});