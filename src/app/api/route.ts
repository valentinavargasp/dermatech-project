import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'API Dermatológica (Next.js Full-Stack) funcionando correctamente',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            afecciones: '/api/afecciones',
            sintomas: '/api/sintomas',
            consultas: '/api/consultas',
            estadisticas: '/api/estadisticas',
        },
    });
}
