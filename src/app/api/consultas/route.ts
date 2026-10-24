import { NextRequest, NextResponse } from 'next/server';
import { verificarAuth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Consulta from '@/models/Consulta';
import Afeccion from '@/models/Afeccion';
import Sintoma from '@/models/Sintoma';
import { fileToBuffer, uploadToCloudinary } from '@/lib/cloudinary';
import { analizarImagenDermatologica } from '@/lib/gemini';

const calcularCoincidencias = (
    sintomasReportados: string[],
    sintomasAfeccion: { toString: () => string }[]
) => {
    const reportadosSet = new Set(sintomasReportados.map((s) => s.toString()));
    const afeccionSet = new Set(sintomasAfeccion.map((s) => s.toString()));

    const coincidentes = sintomasAfeccion.filter((s) =>
        reportadosSet.has(s.toString())
    );
    const interseccion = coincidentes.length;

    const union = reportadosSet.size + afeccionSet.size - interseccion;
    const porcentaje = union > 0 ? (interseccion / union) * 100 : 0;

    return {
        sintomasCoincidentes: coincidentes,
        porcentajeCoincidencia: Math.round(porcentaje),
    };
};

export async function GET(req: NextRequest) {
    const { usuario, errorResponse } = await verificarAuth(req);
    if (errorResponse || !usuario) return errorResponse!;

    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const search = searchParams.get('search');

        const filtros: Record<string, unknown> = { usuario: usuario.id };

        if (search) {
            filtros.nombrePaciente = { $regex: search, $options: 'i' };
        }

        const skip = (page - 1) * limit;

        const [consultas, total] = await Promise.all([
            Consulta.find(filtros)
                .populate('diagnosticoPrincipal', 'nombre severidad')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            Consulta.countDocuments(filtros),
        ]);

        return NextResponse.json({
            success: true,
            data: consultas,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error obteniendo consultas:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error obteniendo consultas',
            },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    const { usuario, errorResponse } = await verificarAuth(req);
    if (errorResponse || !usuario) return errorResponse!;

    try {
        await connectDB();

        let nombrePaciente = '';
        let zonaAfectada = '';
        let sintomasArray: string[] = [];
        let notas = '';
        let imagenFile: File | null = null;

        const contentType = req.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            nombrePaciente = (formData.get('nombrePaciente') as string) || '';
            zonaAfectada = (formData.get('zonaAfectada') as string) || '';
            notas = (formData.get('notas') as string) || '';

            const sintomasRaw = formData.get('sintomasReportados') as string;
            if (sintomasRaw) {
                sintomasArray = JSON.parse(sintomasRaw);
            }

            const file = formData.get('imagenZona');
            if (file && file instanceof File && file.size > 0) {
                imagenFile = file;
            }
        } else {
            const body = await req.json();
            nombrePaciente = body.nombrePaciente || '';
            zonaAfectada = body.zonaAfectada || '';
            notas = body.notas || '';
            sintomasArray = Array.isArray(body.sintomasReportados)
                ? body.sintomasReportados
                : body.sintomasReportados
                  ? JSON.parse(body.sintomasReportados)
                  : [];
        }

        if (!nombrePaciente || !zonaAfectada || sintomasArray.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Faltan campos requeridos o debe seleccionar al menos un síntoma',
                },
                { status: 400 }
            );
        }

        const afecciones = await Afeccion.find({ activo: true }).populate('sintomas');
        const resultados: Array<{
            afeccion: unknown;
            porcentajeCoincidencia: number;
            sintomasCoincidentes: unknown[];
        }> = [];

        for (const afeccion of afecciones) {
            const { sintomasCoincidentes, porcentajeCoincidencia } = calcularCoincidencias(
                sintomasArray,
                afeccion.sintomas.map((s: { _id: { toString: () => string } }) => s._id)
            );

            if (porcentajeCoincidencia > 0) {
                resultados.push({
                    afeccion: afeccion._id,
                    porcentajeCoincidencia,
                    sintomasCoincidentes,
                });
            }
        }

        resultados.sort((a, b) => b.porcentajeCoincidencia - a.porcentajeCoincidencia);
        const topResultados = resultados.slice(0, 5);

        let imagenUrl: string | null = null;
        let rutaImagen: Buffer | null = null;

        if (imagenFile) {
            try {
                const buffer = await fileToBuffer(imagenFile);
                imagenUrl = await uploadToCloudinary(buffer, 'consultas');
                rutaImagen = buffer;
            } catch (error) {
                console.error('Error subiendo imagen a Cloudinary:', error);
                imagenUrl = null;
                rutaImagen = null;
            }
        }

        let notasFinales = notas || '';

        try {
            const sintomasNombres = await Sintoma.find({
                _id: { $in: sintomasArray },
            }).select('nombre');

            const nombres = sintomasNombres.map((s) => s.nombre);

            const analisisIA = await analizarImagenDermatologica({
                sintomas: nombres,
                zonaAfectada,
                rutaImagen,
            });

            notasFinales += '\n\n--- Análisis IA ---\n';
            notasFinales += `Diagnóstico: ${analisisIA.diagnosticoIA}\n\n`;
            notasFinales += `Explicación: ${analisisIA.explicacion}\n\n`;
            notasFinales += 'Recomendaciones:\n';
            if (Array.isArray(analisisIA.recomendaciones)) {
                analisisIA.recomendaciones.forEach((rec, i) => {
                    notasFinales += `${i + 1}. ${rec}\n`;
                });
            }
            notasFinales += `\nUrgencia: ${analisisIA.urgencia}\n\n`;
            notasFinales += analisisIA.advertencia;
        } catch (error) {
            console.error('Error crítico durante el análisis IA:', error);
            notasFinales += '\n\n--- Análisis IA (Error) ---\n';
            notasFinales +=
                'No se pudo completar el análisis por inteligencia artificial debido a un error. Se recomienda encarecidamente la consulta con un profesional médico.';
        }

        const consulta = await Consulta.create({
            nombrePaciente,
            zonaAfectada,
            sintomasReportados: sintomasArray,
            resultados: topResultados,
            diagnosticoPrincipal:
                topResultados.length > 0 ? topResultados[0].afeccion : null,
            usuario: usuario.id,
            imagenZona: imagenUrl,
            notas: notasFinales,
            estado: 'completado',
        });

        const consultaPopulada = await Consulta.findById(consulta._id)
            .populate('sintomasReportados', 'nombre')
            .populate({
                path: 'resultados.afeccion',
                select: 'nombre descripcion severidad imagen',
            })
            .populate({
                path: 'resultados.sintomasCoincidentes',
                select: 'nombre',
            })
            .populate(
                'diagnosticoPrincipal',
                'nombre descripcion tratamiento severidad imagen'
            );

        return NextResponse.json(
            {
                success: true,
                data: consultaPopulada,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creando consulta:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error creando consulta',
            },
            { status: 500 }
        );
    }
}
