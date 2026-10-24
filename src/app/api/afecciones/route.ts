import { NextRequest, NextResponse } from 'next/server';
import { verificarAuth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Afeccion from '@/models/Afeccion';
import '@/models/Sintoma';
import { fileToBuffer, uploadToCloudinary } from '@/lib/cloudinary';

export async function GET(req: NextRequest) {
    const { errorResponse } = await verificarAuth(req);
    if (errorResponse) return errorResponse;

    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');
        const zona = searchParams.get('zona');
        const severidad = searchParams.get('severidad');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '12', 10);

        const filtros: Record<string, unknown> = { activo: true };

        if (search) {
            filtros.$or = [
                { nombre: { $regex: search, $options: 'i' } },
                { descripcion: { $regex: search, $options: 'i' } },
            ];
        }

        if (zona && zona !== 'todas') {
            filtros.zona = zona;
        }

        if (severidad && severidad !== 'todas') {
            filtros.severidad = severidad;
        }

        const skip = (page - 1) * limit;

        const [afecciones, total] = await Promise.all([
            Afeccion.find(filtros)
                .populate('sintomas', 'nombre')
                .skip(skip)
                .limit(limit)
                .sort({ nombre: 1 }),
            Afeccion.countDocuments(filtros),
        ]);

        return NextResponse.json({
            success: true,
            data: afecciones,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error obteniendo afecciones:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error obteniendo afecciones',
            },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    const { errorResponse } = await verificarAuth(req);
    if (errorResponse) return errorResponse;

    try {
        await connectDB();

        let nombre = '';
        let descripcion = '';
        let severidad = '';
        let zona = 'todas';
        let sintomas: string[] = [];
        let tratamiento = '';
        let imagenFile: File | null = null;

        const contentType = req.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            nombre = (formData.get('nombre') as string) || '';
            descripcion = (formData.get('descripcion') as string) || '';
            severidad = (formData.get('severidad') as string) || '';
            zona = (formData.get('zona') as string) || 'todas';
            tratamiento = (formData.get('tratamiento') as string) || '';

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
            nombre = body.nombre || '';
            descripcion = body.descripcion || '';
            severidad = body.severidad || '';
            zona = body.zona || 'todas';
            tratamiento = body.tratamiento || '';
            sintomas = Array.isArray(body.sintomas)
                ? body.sintomas
                : body.sintomas
                  ? JSON.parse(body.sintomas)
                  : [];
        }

        if (!nombre || !descripcion || !severidad) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Faltan campos requeridos',
                },
                { status: 400 }
            );
        }

        const existente = await Afeccion.findOne({ nombre });
        if (existente) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Ya existe una afección con ese nombre',
                },
                { status: 400 }
            );
        }

        let imagenUrl: string | null = null;
        if (imagenFile) {
            try {
                const buffer = await fileToBuffer(imagenFile);
                imagenUrl = await uploadToCloudinary(buffer, 'afecciones');
            } catch (error) {
                console.error('Error subiendo imagen a Cloudinary:', error);
            }
        }

        const afeccion = await Afeccion.create({
            nombre,
            descripcion,
            severidad,
            zona: zona || 'todas',
            sintomas,
            tratamiento,
            imagen: imagenUrl,
        });

        const afeccionPopulada = await Afeccion.findById(afeccion._id).populate(
            'sintomas',
            'nombre'
        );

        return NextResponse.json(
            {
                success: true,
                data: afeccionPopulada,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creando afección:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error creando afección',
            },
            { status: 500 }
        );
    }
}
