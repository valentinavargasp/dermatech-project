import { NextRequest, NextResponse } from 'next/server';
import { verificarAuth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Afeccion from '@/models/Afeccion';
import Sintoma from '@/models/Sintoma';
import Consulta from '@/models/Consulta';

export async function GET(req: NextRequest) {
    const { errorResponse } = await verificarAuth(req);
    if (errorResponse) return errorResponse;

    try {
        await connectDB();

        const [
            totalAfecciones,
            totalSintomas,
            totalConsultas,
            consultasRecientes,
        ] = await Promise.all([
            Afeccion.countDocuments({ activo: true }),
            Sintoma.countDocuments({ activo: true }),
            Consulta.countDocuments(),
            Consulta.find()
                .populate('diagnosticoPrincipal', 'nombre severidad')
                .populate('usuario', 'username')
                .sort({ createdAt: -1 })
                .limit(10),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                totalAfecciones,
                totalSintomas,
                totalConsultas,
                consultasRecientes,
            },
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error obteniendo estadísticas',
            },
            { status: 500 }
        );
    }
}
