import Usuario from '../models/Usuario';
import Sintoma from '../models/Sintoma';
import Afeccion from '../models/Afeccion';

export const seedDatabase = async () => {
    try {
        const [usuarioCount, sintomaCount, afeccionCount] = await Promise.all([
            Usuario.countDocuments(),
            Sintoma.countDocuments(),
            Afeccion.countDocuments(),
        ]);

        if (usuarioCount === 0) {
            console.log('Creando usuario por defecto (alumno)...');
            await Usuario.create({
                username: 'alumno',
                password: 'alu123',
                role: 'alumno',
                activo: true,
            });
        }

        if (sintomaCount > 0 || afeccionCount > 0) {
            return;
        }

        console.log('Iniciando seed de síntomas y afecciones...');

        // Crear síntomas
        const sintomas = await Sintoma.insertMany([
            { nombre: 'Enrojecimiento', descripcion: 'Piel roja e inflamada', zona: 'todas' },
            { nombre: 'Picazón', descripcion: 'Sensación de comezón intensa', zona: 'todas' },
            { nombre: 'Descamación', descripcion: 'Piel seca que se desprende', zona: 'todas' },
            { nombre: 'Ardor', descripcion: 'Sensación de quemazón en la piel', zona: 'todas' },
            { nombre: 'Ampollas', descripcion: 'Pequeñas burbujas llenas de líquido', zona: 'todas' },
            { nombre: 'Pústulas', descripcion: 'Lesiones elevadas con pus', zona: 'todas' },
            { nombre: 'Manchas', descripcion: 'Áreas de coloración diferente', zona: 'todas' },
            { nombre: 'Dolor', descripcion: 'Molestia o dolor al tacto', zona: 'todas' },
            { nombre: 'Inflamación', descripcion: 'Hinchazón de la zona afectada', zona: 'todas' },
            { nombre: 'Sequedad', descripcion: 'Falta de hidratación en la piel', zona: 'todas' },
            { nombre: 'Grasa excesiva', descripcion: 'Producción excesiva de sebo', zona: 'rostro' },
            { nombre: 'Puntos negros', descripcion: 'Comedones abiertos', zona: 'rostro' },
            { nombre: 'Puntos blancos', descripcion: 'Comedones cerrados', zona: 'rostro' },
            { nombre: 'Costras', descripcion: 'Acumulación de células muertas', zona: 'todas' },
            { nombre: 'Grietas', descripcion: 'Fisuras en la piel', zona: 'todas' }
        ]);

        // Crear afecciones
        const afecciones = await Afeccion.insertMany([
            {
                nombre: 'Acné',
                descripcion: 'Condición inflamatoria de la piel que causa espinillas y granos',
                severidad: 'moderada',
                zona: 'rostro',
                sintomas: [sintomas[0]._id, sintomas[1]._id, sintomas[5]._id, sintomas[10]._id, sintomas[11]._id, sintomas[12]._id],
                tratamiento: 'Limpieza facial, peróxido de benzoilo, retinoides tópicos, antibióticos si es necesario'
            },
            {
                nombre: 'Dermatitis atópica (Eczema)',
                descripcion: 'Inflamación crónica de la piel caracterizada por picazón y enrojecimiento',
                severidad: 'moderada',
                zona: 'todas',
                sintomas: [sintomas[0]._id, sintomas[1]._id, sintomas[2]._id, sintomas[9]._id, sintomas[8]._id],
                tratamiento: 'Hidratación constante, cremas con corticoides, evitar irritantes, antihistamínicos'
            },
            {
                nombre: 'Psoriasis',
                descripcion: 'Enfermedad autoinmune que causa manchas rojas escamosas',
                severidad: 'grave',
                zona: 'todas',
                sintomas: [sintomas[0]._id, sintomas[2]._id, sintomas[1]._id, sintomas[6]._id, sintomas[8]._id],
                tratamiento: 'Cremas con corticoides, fototerapia, medicamentos sistémicos, tratamientos biológicos'
            },
            {
                nombre: 'Rosácea',
                descripcion: 'Condición crónica que causa enrojecimiento facial persistente',
                severidad: 'leve',
                zona: 'rostro',
                sintomas: [sintomas[0]._id, sintomas[3]._id, sintomas[8]._id, sintomas[5]._id],
                tratamiento: 'Evitar desencadenantes, antibióticos tópicos u orales, láser vascular'
            },
            {
                nombre: 'Dermatitis de contacto',
                descripcion: 'Reacción alérgica por contacto con sustancias irritantes',
                severidad: 'leve',
                zona: 'todas',
                sintomas: [sintomas[0]._id, sintomas[1]._id, sintomas[3]._id, sintomas[4]._id, sintomas[8]._id],
                tratamiento: 'Identificar y evitar el alérgeno, corticoides tópicos, antihistamínicos'
            },
            {
                nombre: 'Dermatitis seborreica',
                descripcion: 'Inflamación que causa piel escamosa y enrojecida, común en cuero cabelludo',
                severidad: 'leve',
                zona: 'cuero-cabelludo',
                sintomas: [sintomas[2]._id, sintomas[0]._id, sintomas[1]._id, sintomas[10]._id, sintomas[13]._id],
                tratamiento: 'Champús anticaspa, antifúngicos tópicos, corticoides suaves'
            },
            {
                nombre: 'Urticaria',
                descripcion: 'Ronchas elevadas en la piel que causan picazón intensa',
                severidad: 'leve',
                zona: 'todas',
                sintomas: [sintomas[1]._id, sintomas[0]._id, sintomas[8]._id, sintomas[6]._id],
                tratamiento: 'Antihistamínicos, identificar y evitar desencadenantes, corticoides si es grave'
            },
            {
                nombre: 'Herpes simple',
                descripcion: 'Infección viral que causa ampollas dolorosas',
                severidad: 'moderada',
                zona: 'rostro',
                sintomas: [sintomas[4]._id, sintomas[7]._id, sintomas[0]._id, sintomas[3]._id, sintomas[13]._id],
                tratamiento: 'Antivirales orales o tópicos, analgésicos, mantener área limpia'
            },
            {
                nombre: 'Tiña',
                descripcion: 'Infección fúngica que causa manchas circulares rojizas',
                severidad: 'leve',
                zona: 'todas',
                sintomas: [sintomas[0]._id, sintomas[1]._id, sintomas[2]._id, sintomas[6]._id],
                tratamiento: 'Antifúngicos tópicos u orales, mantener área seca y limpia'
            },
            {
                nombre: 'Xerosis (Piel seca)',
                descripcion: 'Sequedad extrema de la piel',
                severidad: 'leve',
                zona: 'todas',
                sintomas: [sintomas[9]._id, sintomas[2]._id, sintomas[1]._id, sintomas[14]._id],
                tratamiento: 'Hidratación frecuente, humectantes emolientes, evitar baños calientes largos'
            }
        ]);

        console.log(`Seed completado: 1 usuario, ${sintomas.length} síntomas, ${afecciones.length} afecciones`);
    } catch (error) {
        console.error('Error en seed:', error);
    }
};
