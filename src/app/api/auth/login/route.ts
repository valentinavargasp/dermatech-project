import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { seedDatabase } from '@/lib/seed';
import Usuario from '@/models/Usuario';
import { generarToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        await seedDatabase();

        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Por favor ingrese usuario y contraseña',
                },
                { status: 400 }
            );
        }

        const usuario = await Usuario.findOne({ username, activo: true });

        if (!usuario) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Credenciales inválidas',
                },
                { status: 401 }
            );
        }

        const passwordMatch = await usuario.comparePassword(password);

        if (!passwordMatch) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Credenciales inválidas',
                },
                { status: 401 }
            );
        }

        const token = generarToken(usuario._id.toString());

        return NextResponse.json({
            success: true,
            data: {
                id: usuario._id,
                username: usuario.username,
                role: usuario.role,
                token,
            },
        });
    } catch (error) {
        console.error('Error en login:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error en el servidor',
            },
            { status: 500 }
        );
    }
}
