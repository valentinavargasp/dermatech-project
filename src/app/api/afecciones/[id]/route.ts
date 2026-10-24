import { NextRequest, NextResponse } from 'next/server';
import { verificarAuth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Afeccion from '@/models/Afeccion';
import '@/models/Sintoma';
import {
    fileToBuffer,
    uploadToCloudinary,
    deleteFromCloudinary,
} from '@/lib/cloudinary';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { errorResponse } = await verificarAuth(req);
    if (errorResponse) return errorResponse;

    try {
        await connectDB();
        const { id } = await context.params;
        const afeccion = await Afeccion.findById(id).populate(
            'sintomas',
            'nombre descripcion zona'
        );

        if (!afeccion) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Afección no encontrada',
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: afeccion,
        });
    } catch (error) {
        console.error('Error obteniendo afección:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error obteniendo afección',
            },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { errorResponse } = await verificarAuth(req);
    if (errorResponse) return errorResponse;

    try {
        await connectDB();
        const { id } = await context.params;
        const afeccion = await Afeccion.findById(id);

        if (!afeccion) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Afección no encontrada',
                },
                { status: 404 }
            );
        }

        let nombre: string | undefined;
        let descripcion: string | undefined;
        let severidad: string | undefined;
        let zona: string | undefined;
        let sintomas: string[] | undefined;
        let tratamiento: string | undefined;
        let imagenFile: File | null = null;

        const contentType = req.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            nombre = (formData.get('nombre') as string) || undefined;
            descripcion = (formData.get('descripcion') as string) || undefined;
            severidad = (formData.get('severidad') as string) || undefined;
            zona = (formData.get('zona') as string) || undefined;
            tratamiento = (formData.get('tratamiento') as string) ?? undefined;

            const sintomasRaw = formData.get('sintomas') as string;
            if (sintomasRaw) {
                sintomas = JSON.parse(sintomasRaw);
            }

            const file = formData.get('imagen');
            if (file && file instanceof File && file.size > 0) {
                imagenFile = file;
            }
        } else {
            const body = await req.json();
            nombre = body.nombre;
            descripcion = body.descripcion;
            severidad = body.severidad;
            zona = body.zona;
            tratamiento = body.tratamiento;
            if (body.sintomas) {
                sintomas = Array.isArray(body.sintomas)
                    ? body.sintomas
                    : JSON.parse(body.sintomas);
            }
        }

        if (nombre) afeccion.nombre = nombre;
        if (descripcion) afeccion.descripcion = descripcion;
        if (severidad) afeccion.severidad = severidad;
        if (zona) afeccion.zona = zona;
        if (sintomas) afeccion.sintomas = sintomas;
        if (tratamiento !== undefined) afeccion.tratamiento = tratamiento;

        if (imagenFile) {
            if (afeccion.imagen && afeccion.imagen.includes('cloudinary.com')) {
                try {
                    await deleteFromCloudinary(afeccion.imagen);
                } catch (err) {
                    console.error('Error eliminando imagen anterior de Cloudinary:', err);
                }
            }

            try {
                const buffer = await fileToBuffer(imagenFile);
                const nuevaImagenUrl = await uploadToCloudinary(buffer, 'afecciones');
                afeccion.imagen = nuevaImagenUrl;
            } catch (error) {
                console.error('Error subiendo nueva imagen a Cloudinary:', error);
            }
        }

        await afeccion.save();

        const afeccionPopulada = await Afeccion.findById(afeccion._id).populate(
            'sintomas',
            'nombre'
        );

        return NextResponse.json({
            success: true,
            data: afeccionPopulada,
        });
    } catch (error) {
        console.error('Error actualizando afección:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error actualizando afección',
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { errorResponse } = await verificarAuth(req);
    if (errorResponse) return errorResponse;

    try {
        await connectDB();
        const { id } = await context.params;
        const afeccion = await Afeccion.findById(id);

        if (!afeccion) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Afección no encontrada',
                },
                { status: 404 }
            );
        }

        await Afeccion.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: 'Afección eliminada exitosamente de la base de datos',
        });
    } catch (error) {
        console.error('Error eliminando afección:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error eliminando afección',
            },
            { status: 500 }
        );
    }
}
