import { NextRequest, NextResponse } from 'next/server';
import { verificarAuth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Consulta from '@/models/Consulta';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { usuario, errorResponse } = await verificarAuth(req);
    if (errorResponse || !usuario) return errorResponse!;

    try {
        await connectDB();
        const { id } = await context.params;
        const consulta = await Consulta.findById(id)
            .populate('sintomasReportados', 'nombre descripcion')
            .populate({
                path: 'resultados.afeccion',
                select: 'nombre descripcion severidad imagen tratamiento',
            })
            .populate({
                path: 'resultados.sintomasCoincidentes',
                select: 'nombre',
            })
            .populate('diagnosticoPrincipal')
            .populate('usuario', 'username');

        if (!consulta) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Consulta no encontrada',
                },
                { status: 404 }
            );
        }

        if (
            consulta.usuario._id.toString() !== usuario.id &&
            usuario.role !== 'admin'
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'No autorizado',
                },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            data: consulta,
        });
    } catch (error) {
        console.error('Error obteniendo consulta:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error obteniendo consulta',
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { usuario, errorResponse } = await verificarAuth(req);
    if (errorResponse || !usuario) return errorResponse!;

    try {
        await connectDB();
        const { id } = await context.params;
        const consulta = await Consulta.findById(id);

        if (!consulta) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Consulta no encontrada',
                },
                { status: 404 }
            );
        }

        if (
            consulta.usuario.toString() !== usuario.id &&
            usuario.role !== 'admin'
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'No autorizado para eliminar esta consulta',
                },
                { status: 403 }
            );
        }

        await Consulta.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: 'Consulta eliminada exitosamente de la base de datos',
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Error eliminando consulta:', message);
        return NextResponse.json(
            {
                success: false,
                message: 'Error eliminando consulta: ' + message,
            },
            { status: 500 }
        );
    }
}
