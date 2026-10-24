import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from './mongodb';
import Usuario from '../models/Usuario';

const getJwtSecret = () => process.env.JWT_SECRET || 'secret-key';
const getJwtExpire = () => process.env.JWT_EXPIRE || '30d';

export const generarToken = (id: string) => {
    return jwt.sign({ id }, getJwtSecret(), {
        expiresIn: getJwtExpire() as jwt.SignOptions['expiresIn'],
    });
};

export interface AuthUser {
    _id: string;
    id: string;
    username: string;
    role: 'alumno' | 'admin';
    activo: boolean;
}

export async function verificarAuth(
    req: NextRequest
): Promise<{ usuario?: AuthUser; errorResponse?: NextResponse }> {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
            errorResponse: NextResponse.json(
                {
                    success: false,
                    message: 'No hay token, autorización denegada',
                },
                { status: 401 }
            ),
        };
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, getJwtSecret()) as { id: string };

        await connectDB();
        const usuarioDoc = await Usuario.findById(decoded.id).select('-password');

        if (!usuarioDoc || !usuarioDoc.activo) {
            return {
                errorResponse: NextResponse.json(
                    {
                        success: false,
                        message: 'Usuario no autorizado',
                    },
                    { status: 401 }
                ),
            };
        }

        return {
            usuario: {
                _id: usuarioDoc._id.toString(),
                id: usuarioDoc._id.toString(),
                username: usuarioDoc.username,
                role: usuarioDoc.role,
                activo: usuarioDoc.activo,
            },
        };
    } catch (error) {
        console.error('Error en autenticación:', error);
        return {
            errorResponse: NextResponse.json(
                {
                    success: false,
                    message: 'Token inválido',
                },
                { status: 401 }
            ),
        };
    }
}
