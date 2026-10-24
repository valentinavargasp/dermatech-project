import { NextRequest, NextResponse } from 'next/server';
import { verificarAuth } from '@/lib/auth';
import Usuario from '@/models/Usuario';

export async function GET(req: NextRequest) {
    const { usuario, errorResponse } = await verificarAuth(req);
    if (errorResponse || !usuario) return errorResponse!;

    try {
        const userDoc = await Usuario.findById(usuario.id);

        if (!userDoc) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Usuario no encontrado',
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: userDoc,
        });
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error en el servidor',
            },
            { status: 500 }
        );
    }
}
