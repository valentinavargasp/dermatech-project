import { NextRequest, NextResponse } from 'next/server';
import { verificarAuth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Consulta from '@/models/Consulta';

export async function GET(req: NextRequest) {
    const { usuario, errorResponse } = await verificarAuth(req);
    if (errorResponse || !usuario) return errorResponse!;

    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '5', 10);

        const consultas = await Consulta.find({ usuario: usuario.id })
            .populate('diagnosticoPrincipal', 'nombre severidad')
            .sort({ createdAt: -1 })
            .limit(limit);

        return NextResponse.json({
            success: true,
            data: consultas,
        });
    } catch (error) {
        console.error('Error obteniendo consultas recientes:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error obteniendo consultas recientes',
            },
            { status: 500 }
        );
    }
}
