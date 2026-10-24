import { NextRequest, NextResponse } from 'next/server';
import { verificarAuth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Afeccion from '@/models/Afeccion';

export async function GET(req: NextRequest) {
    const { errorResponse } = await verificarAuth(req);
    if (errorResponse) return errorResponse;

    try {
        await connectDB();

        const distribucion = await Afeccion.aggregate([
            { $match: { activo: true } },
            { $group: { _id: '$severidad', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);

        return NextResponse.json({
            success: true,
            data: distribucion,
        });
    } catch (error) {
        console.error('Error obteniendo distribución:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error obteniendo distribución',
            },
            { status: 500 }
        );
    }
}
