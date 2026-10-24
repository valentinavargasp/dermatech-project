import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

let genAI: GoogleGenerativeAI | null = null;

const getApiKey = () => process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY;

const initGenAI = () => {
    const apiKey = getApiKey();
    if (!genAI && apiKey) {
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
};

const getModel = () => {
    const client = initGenAI();
    if (!client) {
        throw new Error('Cliente Gemini no inicializado - verifica GOOGLE_AI_API_KEY');
    }
    return client.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

function archivoAparte(ruta: string, mimeType: string) {
    if (!fs.existsSync(ruta)) {
        throw new Error(`Archivo no encontrado en la ruta: ${ruta}`);
    }
    const datosBinarios = fs.readFileSync(ruta);
    const base64Data = datosBinarios.toString('base64');

    return {
        inlineData: {
            data: base64Data,
            mimeType,
        },
    };
}

function bufferToImagePart(buffer: Buffer, mimeType: string) {
    const base64Data = buffer.toString('base64');
    return {
        inlineData: {
            data: base64Data,
            mimeType,
        },
    };
}

function detectMimeType(buffer: Buffer): string {
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return 'image/jpeg';
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
        return 'image/png';
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        return 'image/gif';
    }
    if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
        return 'image/webp';
    }
    return 'image/jpeg';
}

export interface AnalisisIAResult {
    diagnosticoIA: string;
    explicacion: string;
    recomendaciones: string[];
    urgencia: string;
    advertencia: string;
}

const getErrorResponse = (message = 'No se pudo realizar un análisis detallado.'): AnalisisIAResult => ({
    diagnosticoIA: 'Análisis no disponible',
    explicacion: message,
    recomendaciones: [
        'Mantener la zona limpia y seca',
        'Evitar rascar o irritar la zona',
        'Consultar con un dermatólogo para una evaluación profesional',
    ],
    urgencia: 'indeterminada',
    advertencia: 'Esta es una orientación general. Consulte a un profesional médico para un diagnóstico preciso.',
});

export const analizarImagenDermatologica = async ({
    sintomas,
    zonaAfectada,
    rutaImagen,
}: {
    sintomas: string[] | string;
    zonaAfectada: string;
    rutaImagen?: Buffer | string | null;
}): Promise<AnalisisIAResult> => {
    try {
        const apiKey = getApiKey();
        if (!apiKey || apiKey === 'tu-api-key-de-google') {
            console.log('API key no configurada para análisis de imagen');
            return getErrorResponse('API key de Gemini no configurada.');
        }

        const model = getModel();
        let prompt: string;
        const parts: Array<string | { inlineData: { data: string; mimeType: string } }> = [];

        if (rutaImagen) {
            let imagePart: { inlineData: { data: string; mimeType: string } };
            let mimeType: string;

            if (Buffer.isBuffer(rutaImagen)) {
                mimeType = detectMimeType(rutaImagen);
                imagePart = bufferToImagePart(rutaImagen, mimeType);
            } else if (typeof rutaImagen === 'string') {
                mimeType = 'image/jpeg';
                if (rutaImagen.toLowerCase().endsWith('.png')) mimeType = 'image/png';
                imagePart = archivoAparte(rutaImagen, mimeType);
            } else {
                throw new Error('Formato de imagen no soportado');
            }

            prompt = `Eres un asistente médico especializado en dermatología. Analiza la imagen y los datos del paciente. Responde EXACTAMENTE con un JSON válido (sin markdown) con este formato:
            {
                "diagnosticoIA": "diagnóstico probable (2-4 frases)",
                "explicacion": "Explicación detallada del diagnóstico basada en la imagen y síntomas",
                "recomendaciones": ["Recomendación 1", "Recomendación 2", "Recomendación 3"],
                "urgencia": "bajo",
                "advertencia": "Esta información es referencial. Consulte con un dermatólogo profesional para un diagnóstico preciso y tratamiento adecuado."
            }
            ---
            DATOS DEL PACIENTE:
            - Zona afectada: ${zonaAfectada}
            - Síntomas reportados: ${Array.isArray(sintomas) ? sintomas.join(', ') : sintomas}`;

            parts.push(prompt, imagePart);
        } else {
            prompt = `Eres un asistente médico especializado en dermatología. Analiza los datos del paciente. Responde EXACTAMENTE con un JSON válido (sin markdown) con este formato:
            {
                "diagnosticoIA": "diagnóstico probable basado en síntomas (2-4 frases)",
                "explicacion": "Explicación detallada del diagnóstico basada en los síntomas reportados",
                "recomendaciones": ["Recomendación 1", "Recomendación 2", "Recomendación 3"],
                "urgencia": "medio",
                "advertencia": "Esta información es referencial. Consulte con un dermatólogo profesional para un diagnóstico preciso y tratamiento adecuado."
            }
            ---
            DATOS DEL PACIENTE:
            - Zona afectada: ${zonaAfectada}
            - Síntomas reportados: ${Array.isArray(sintomas) ? sintomas.join(', ') : sintomas}`;

            parts.push(prompt);
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        try {
            const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleanText);
            return parsed;
        } catch (parseError) {
            console.error('Error parseando JSON de Gemini:', parseError);
            return getErrorResponse('La respuesta del análisis no tuvo un formato válido.');
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Error en el servicio de análisis de Gemini:', message);

        if (message.includes('503') || message.toLowerCase().includes('overloaded')) {
            return getErrorResponse(
                'El servicio de análisis está sobrecargado. Por favor, inténtalo de nuevo más tarde.'
            );
        }

        return getErrorResponse('No se pudo completar el análisis debido a un error inesperado.');
    }
};
