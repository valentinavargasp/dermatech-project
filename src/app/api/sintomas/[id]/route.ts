import { NextRequest, NextResponse } from 'next/server';
import { verificarAuth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Sintoma from '@/models/Sintoma';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { errorResponse } = await verificarAuth(req);
    if (errorResponse) return errorResponse;

    try {
        await connectDB();
        const { id } = await context.params;
        const sintoma = await Sintoma.findById(id);

        if (!sintoma) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Síntoma no encontrado',
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: sintoma,
        });
    } catch (error) {
        console.error('Error obteniendo síntoma:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error obteniendo síntoma',
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
        const sintoma = await Sintoma.findById(id);

        if (!sintoma) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Síntoma no encontrado',
                },
                { status: 404 }
            );
        }

        const { nombre, descripcion, zona } = await req.json();

        if (nombre) sintoma.nombre = nombre;
        if (descripcion !== undefined) sintoma.descripcion = descripcion;
        if (zona) sintoma.zona = zona;

        await sintoma.save();

        return NextResponse.json({
            success: true,
            data: sintoma,
        });
    } catch (error) {
        console.error('Error actualizando síntoma:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error actualizando síntoma',
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
        const sintoma = await Sintoma.findById(id);

        if (!sintoma) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Síntoma no encontrado',
                },
                { status: 404 }
            );
        }

        await Sintoma.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: 'Síntoma eliminado exitosamente de la base de datos',
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Error eliminando síntoma:', message);
        return NextResponse.json(
            {
                success: false,
                message: 'Error eliminando síntoma: ' + message,
            },
            { status: 500 }
        );
    }
}
