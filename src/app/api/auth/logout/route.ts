import { NextRequest, NextResponse } from 'next/server';
import { verificarAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const { errorResponse } = await verificarAuth(req);
    if (errorResponse) return errorResponse;

    return NextResponse.json({
        success: true,
        message: 'Sesión cerrada exitosamente',
    });
}
