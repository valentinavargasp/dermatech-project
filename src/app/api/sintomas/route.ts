import { NextRequest, NextResponse } from 'next/server';
import { verificarAuth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Sintoma from '@/models/Sintoma';

export async function GET(req: NextRequest) {
    const { errorResponse } = await verificarAuth(req);
    if (errorResponse) return errorResponse;

    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');
        const zona = searchParams.get('zona');

        const filtros: Record<string, unknown> = { activo: true };

        if (search) {
            filtros.$or = [
                { nombre: { $regex: search, $options: 'i' } },
                { descripcion: { $regex: search, $options: 'i' } },
            ];
        }

        if (zona && zona !== 'todas') {
            if (filtros.$or) {
                filtros.$and = [
                    { $or: filtros.$or as unknown[] },
                    { $or: [{ zona }, { zona: 'todas' }] },
                ];
                delete filtros.$or;
            } else {
                filtros.$or = [{ zona }, { zona: 'todas' }];
            }
        }

        const sintomas = await Sintoma.find(filtros).sort({ nombre: 1 });

        return NextResponse.json({
            success: true,
            data: sintomas,
        });
    } catch (error) {
        console.error('Error obteniendo síntomas:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error obteniendo síntomas',
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
        const { nombre, descripcion, zona } = await req.json();

        if (!nombre) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'El nombre es requerido',
                },
                { status: 400 }
            );
        }

        const existente = await Sintoma.findOne({ nombre });
        if (existente) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Ya existe un síntoma con ese nombre',
                },
                { status: 400 }
            );
        }

        const sintoma = await Sintoma.create({
            nombre,
            descripcion,
            zona: zona || 'todas',
        });

        return NextResponse.json(
            {
                success: true,
                data: sintoma,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creando síntoma:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error creando síntoma',
            },
            { status: 500 }
        );
    }
}
