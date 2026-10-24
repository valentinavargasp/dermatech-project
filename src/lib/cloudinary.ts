import cloudinary from 'cloudinary';
import { Readable } from 'stream';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.v2.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function fileToBuffer(file: File): Promise<Buffer> {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)');
    }
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('La imagen no debe superar los 5MB');
    }
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

export const uploadToCloudinary = (
    buffer: Buffer,
    folder = 'dermatologica',
    publicId?: string
): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!cloudName || !apiKey || !apiSecret) {
            reject(new Error('Cloudinary no está configurado correctamente. Verifica las variables de entorno.'));
            return;
        }

        if (!buffer || !Buffer.isBuffer(buffer)) {
            reject(new Error('Buffer de imagen inválido'));
            return;
        }

        const uploadStream = cloudinary.v2.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                ...(publicId ? { public_id: publicId } : {}),
                transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }],
            },
            (error, result) => {
                if (error || !result) {
                    console.error('Error subiendo a Cloudinary:', error?.message);
                    reject(error || new Error('No se recibió respuesta de Cloudinary'));
                } else {
                    resolve(result.secure_url);
                }
            }
        );

        const readable = new Readable();
        readable.push(buffer);
        readable.push(null);
        readable.pipe(uploadStream);
    });
};

export const deleteFromCloudinary = async (imageUrl: string) => {
    try {
        const urlParts = imageUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = filename.split('.')[0];

        const uploadIndex = urlParts.indexOf('upload');
        let fullPublicId = publicId;

        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
            const folder = urlParts[uploadIndex + 1];
            fullPublicId = `${folder}/${publicId}`;
        }

        return await cloudinary.v2.uploader.destroy(fullPublicId, {
            resource_type: 'image',
        });
    } catch (error) {
        console.error('Error eliminando de Cloudinary:', error);
        throw error;
    }
};
