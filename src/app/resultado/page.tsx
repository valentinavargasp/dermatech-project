'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ImageModal from '@/components/ImageModal';
import { useApp } from '@/context/AppContext';

interface Sintoma {
    _id: string;
    nombre: string;
    descripcion?: string;
}

interface ResultadoMatch {
    afeccion: {
        _id: string;
        nombre: string;
        descripcion?: string;
        severidad?: string;
        imagen?: string;
        tratamiento?: string;
    };
    porcentajeCoincidencia: number;
    sintomasCoincidentes: Sintoma[];
}

interface ConsultaDetalle {
    _id: string;
    nombrePaciente: string;
    zonaAfectada: string;
    imagenZona?: string | null;
    sintomasReportados: Sintoma[];
    resultados: ResultadoMatch[];
    diagnosticoPrincipal?: {
        _id: string;
        nombre: string;
        descripcion?: string;
        severidad?: string;
        tratamiento?: string;
    } | null;
    notas?: string;
    createdAt: string;
}

function parseNotasIA(notas?: string) {
    if (!notas) return null;
    const iaMarker = '--- Análisis IA ---';
    const clinicoMarker = '--- Análisis Clínico ---';

    let analisisContent = '';
    let tipoAnalisis: 'IA' | 'Clínico' | null = null;

    if (notas.includes(iaMarker)) {
        analisisContent = notas.split(iaMarker)[1].trim();
        tipoAnalisis = 'IA';
    } else if (notas.includes(clinicoMarker)) {
        analisisContent = notas.split(clinicoMarker)[1].trim();
        tipoAnalisis = 'Clínico';
    } else {
        return null;
    }

    const lines = analisisContent.split('\n');
    let diagnosticoIA = '';
    let explicacion = '';
    const recomendaciones: string[] = [];
    let urgencia = '';
    let advertencia = '';
    let currentSection = 'inicio';

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('Diagnóstico') || trimmed.startsWith('diagnosticoIA')) {
            currentSection = 'diagnostico';
            const valor = trimmed.split(':').slice(1).join(':').trim();
            if (valor) diagnosticoIA = valor;
            continue;
        } else if (trimmed.includes('Explicación') || trimmed.includes('explicacion')) {
            currentSection = 'explicacion';
            const valor = trimmed.split(':').slice(1).join(':').trim();
            if (valor) explicacion = valor;
            continue;
        } else if (trimmed.includes('Recomendaciones')) {
            currentSection = 'recomendaciones';
            continue;
        } else if (trimmed.startsWith('Urgencia') || trimmed.startsWith('Nivel de Urgencia')) {
            currentSection = 'urgencia';
            urgencia = trimmed.split(':').slice(1).join(':').trim().toUpperCase();
            continue;
        } else if (trimmed.includes('IMPORTANTE:') || trimmed.includes('profesional')) {
            currentSection = 'advertencia';
            advertencia = trimmed;
            continue;
        }

        if (currentSection === 'diagnostico' && trimmed && !trimmed.includes('---')) {
            diagnosticoIA += ' ' + trimmed;
        } else if (currentSection === 'explicacion' && trimmed && !trimmed.includes('---')) {
            explicacion += ' ' + trimmed;
        } else if (currentSection === 'recomendaciones' && trimmed) {
            const rec = trimmed.replace(/^\d+\.\s*/, '').trim();
            if (rec && !rec.includes('Urgencia') && !rec.includes('---')) {
                recomendaciones.push(rec);
            }
        } else if (currentSection === 'advertencia' && trimmed && !advertencia.includes(trimmed)) {
            advertencia += ' ' + trimmed;
        }
    }

    return {
        tipoAnalisis,
        diagnosticoIA: diagnosticoIA.trim(),
        explicacion: explicacion.trim(),
        recomendaciones,
        urgencia,
        advertencia: advertencia.trim(),
    };
}

function ResultadoContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { fetchAPI, getImageUrl, showToast } = useApp();

    const id = searchParams.get('id');
    const [consulta, setConsulta] = useState<ConsultaDetalle | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandSintomas, setExpandSintomas] = useState(true);
    const [expandImagen, setExpandImagen] = useState(true);
    const [modalImage, setModalImage] = useState<string | null>(null);

    const cargarResultado = useCallback(async () => {
        if (!id) {
            showToast('No se especificó una consulta', 'error');
            router.replace('/dashboard');
            return;
        }
        try {
            setLoading(true);
            const res = await fetchAPI<{ success: boolean; data: ConsultaDetalle }>(
                `/consultas/${id}`
            );
            if (res && res.success && res.data) {
                setConsulta(res.data);
            } else {
                showToast('No se encontró la consulta', 'error');
            }
        } catch (error) {
            console.error('Error cargando consulta:', error);
        } finally {
            setLoading(false);
        }
    }, [id, fetchAPI, router, showToast]);

    useEffect(() => {
        cargarResultado();
    }, [cargarResultado]);

    if (loading) {
        return (
            <div className="py-20 text-center">
                <i className="fas fa-spinner fa-spin text-4xl text-[#2C5F7C]" />
                <p className="mt-4 text-slate-500">Cargando resultados del diagnóstico...</p>
            </div>
        );
    }

    if (!consulta) {
        return (
            <div className="mx-auto max-w-lg rounded-xl bg-white p-8 text-center shadow-sm">
                <i className="fas fa-exclamation-triangle mb-3 text-4xl text-[#FF6B6B]" />
                <h3 className="text-xl font-bold text-slate-800">Error al Cargar Resultados</h3>
                <p className="mt-2 mb-6 text-slate-500">
                    No se pudo cargar la información del diagnóstico solicitado.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#2C5F7C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e4357]"
                >
                    <i className="fas fa-home" /> Volver al Dashboard
                </Link>
            </div>
        );
    }

    const fechaFormateada = new Date(consulta.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const analisisIA = parseNotasIA(consulta.notas);
    const notas = consulta.notas || '';
    const tieneImagen = !!consulta.imagenZona;
    const tieneAnalisisIAExitoso =
        notas.includes('--- Análisis IA ---') &&
        !notas.includes('--- Análisis IA (Error) ---') &&
        !notas.toLowerCase().includes('sobrecargado') &&
        !notas.includes('Diagnóstico: Análisis no disponible') &&
        !notas.includes('Diagnóstico:Análisis no disponible');

    const debeMostrarDiagnosticos = !tieneImagen || !tieneAnalisisIAExitoso;
    const diagnosticosOrdenados = [...(consulta.resultados || [])].sort(
        (a, b) => b.porcentajeCoincidencia - a.porcentajeCoincidencia
    );

    const getPctBadgeClass = (pct: number) => {
        if (pct >= 70) return 'bg-[#5FD4A6]/15 text-[#2d8a68]';
        if (pct >= 40) return 'bg-[#FF9F66]/15 text-[#cc6d2d]';
        return 'bg-slate-100 text-slate-600';
    };

    const getUrgenciaBadgeClass = (urgencia: string) => {
        const lower = urgencia.toLowerCase();
        if (lower.includes('baj')) return 'bg-[#5FD4A6] text-white';
        if (lower.includes('med')) return 'bg-[#FF9F66] text-white';
        if (lower.includes('alt') || lower.includes('grav')) return 'bg-[#FF6B6B] text-white';
        return 'bg-white/20 text-white';
    };

    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <div className="py-4 text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#5FD4A6] to-[#4ab88c] text-5xl text-white shadow-lg">
                    <i className="fas fa-check-circle" />
                </div>
                <h2 className="text-3xl font-bold text-[#2C5F7C]">Diagnóstico Completado</h2>
                <p className="mt-1 text-slate-500">
                    Se ha completado el análisis integral de su consulta
                </p>
            </div>

            {/* Patient Info Card */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#2C5F7C]">
                    <i className="fas fa-user-injured" /> Información del Paciente
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                        <span className="block text-xs font-semibold uppercase text-slate-400">
                            Nombre
                        </span>
                        <span className="text-lg font-bold text-slate-800">
                            {consulta.nombrePaciente}
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs font-semibold uppercase text-slate-400">
                            Zona Afectada
                        </span>
                        <span className="mt-1 inline-flex rounded-full bg-[#2C5F7C]/15 px-3 py-1 text-xs font-bold uppercase text-[#2C5F7C]">
                            {consulta.zonaAfectada}
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs font-semibold uppercase text-slate-400">
                            Fecha de Consulta
                        </span>
                        <span className="text-base font-semibold text-slate-700">
                            {fechaFormateada}
                        </span>
                    </div>
                </div>
            </div>

            {/* Symptoms & Image Collapsible Section */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Left: Symptoms */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setExpandSintomas(!expandSintomas)}
                            className="mb-3 flex w-full items-center gap-2 text-left text-lg font-semibold text-[#2C5F7C] cursor-pointer"
                        >
                            <i
                                className={`fas fa-chevron-right text-sm transition-transform ${
                                    expandSintomas ? 'rotate-90' : ''
                                }`}
                            />
                            <i className="fas fa-notes-medical" /> Síntomas Reportados (
                            {consulta.sintomasReportados?.length || 0})
                        </button>
                        {expandSintomas && (
                            <div className="grid grid-cols-1 gap-2.5 pl-4 sm:grid-cols-2">
                                {consulta.sintomasReportados?.map((s) => (
                                    <div
                                        key={s._id}
                                        className="flex items-center gap-2 rounded-lg border-2 border-[#5FD4A6] bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700"
                                    >
                                        <i className="fas fa-check-circle text-[#5FD4A6]" />
                                        <span>{s.nombre}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Provided Image */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setExpandImagen(!expandImagen)}
                            className="mb-3 flex w-full items-center gap-2 text-left text-lg font-semibold text-[#2C5F7C] cursor-pointer"
                        >
                            <i
                                className={`fas fa-chevron-right text-sm transition-transform ${
                                    expandImagen ? 'rotate-90' : ''
                                }`}
                            />
                            <i className="fas fa-image" /> Imagen Proporcionada
                        </button>
                        {expandImagen && (
                            <div className="pl-4">
                                {consulta.imagenZona ? (
                                    <div className="space-y-3">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={getImageUrl(consulta.imagenZona)}
                                            alt="Imagen de consulta"
                                            className="max-h-64 rounded-xl object-contain shadow-xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setModalImage(consulta.imagenZona!)}
                                            className="inline-flex items-center gap-2 rounded-lg bg-[#5FD4A6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4ab88c] cursor-pointer"
                                        >
                                            <i className="fas fa-expand" /> Ampliar Imagen
                                        </button>
                                    </div>
                                ) : (
                                    <p className="italic text-sm text-slate-400">
                                        <i className="fas fa-info-circle mr-1.5" /> No se
                                        proporcionó ninguna imagen en esta consulta
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Analysis Card */}
            {analisisIA && (
                <div className="rounded-xl bg-gradient-to-br from-[#2d6a8a] to-[#3a9e7d] p-6 sm:p-8 text-white shadow-lg space-y-5">
                    <h3 className="flex items-center gap-3 text-2xl font-bold text-white">
                        <i
                            className={`fas ${
                                analisisIA.tipoAnalisis === 'IA'
                                    ? 'fa-robot'
                                    : 'fa-clipboard-medical'
                            } text-3xl`}
                        />
                        {analisisIA.tipoAnalisis === 'IA'
                            ? 'Análisis con Inteligencia Artificial'
                            : 'Análisis Clínico'}
                    </h3>

                    {analisisIA.diagnosticoIA && (
                        <div className="rounded-xl bg-white/10 p-5 backdrop-blur-xs">
                            <h4 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
                                <i className="fas fa-stethoscope" /> Diagnóstico
                            </h4>
                            <p className="font-semibold leading-relaxed text-white">
                                {analisisIA.diagnosticoIA}
                            </p>
                        </div>
                    )}

                    {analisisIA.explicacion && (
                        <div className="rounded-xl bg-white/10 p-5 backdrop-blur-xs">
                            <h4 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
                                <i className="fas fa-lightbulb" /> Explicación
                            </h4>
                            <p className="leading-relaxed text-white/95">
                                {analisisIA.explicacion}
                            </p>
                        </div>
                    )}

                    {analisisIA.recomendaciones.length > 0 && (
                        <div className="rounded-xl bg-white/10 p-5 backdrop-blur-xs">
                            <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                                <i className="fas fa-list-check" /> Recomendaciones
                            </h4>
                            <ul className="space-y-2">
                                {analisisIA.recomendaciones.map((rec, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-start gap-2.5 rounded-lg bg-white/5 p-3 text-sm text-white/95"
                                    >
                                        <i className="fas fa-check mt-1 text-[#5FD4A6]" />
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {analisisIA.urgencia && (
                        <div className="rounded-xl bg-white/10 p-5 backdrop-blur-xs">
                            <h4 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
                                <i className="fas fa-exclamation-triangle" /> Nivel de Urgencia
                            </h4>
                            <span
                                className={`inline-block rounded-lg px-4 py-2 text-base font-bold uppercase ${getUrgenciaBadgeClass(
                                    analisisIA.urgencia
                                )}`}
                            >
                                {analisisIA.urgencia}
                            </span>
                        </div>
                    )}

                    {analisisIA.advertencia && (
                        <div className="rounded-xl border-l-4 border-[#FFD93D] bg-white/15 p-4 text-sm text-white">
                            <p className="flex items-start gap-2">
                                <i className="fas fa-info-circle mt-0.5 text-[#FFD93D]" />
                                <span>{analisisIA.advertencia}</span>
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Possible Diagnoses (Jaccard Matches) */}
            {debeMostrarDiagnosticos && (
                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#2C5F7C]">
                        <i className="fas fa-diagnoses" /> Diagnósticos Posibles en Base de Datos
                    </h3>

                    {diagnosticosOrdenados.length === 0 ? (
                        <p className="text-sm text-slate-400">
                            No se encontraron coincidencias con afecciones registradas.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {diagnosticosOrdenados.map((diag, index) => {
                                if (!diag.afeccion) return null;
                                const desc = (diag.afeccion.descripcion || '').substring(0, 100);
                                return (
                                    <div
                                        key={diag.afeccion._id || index}
                                        className={`flex flex-col justify-between rounded-xl border p-4 transition-all hover:-translate-y-1 hover:shadow-md ${
                                            index === 0
                                                ? 'border-2 border-[#5FD4A6] bg-[#5FD4A6]/5'
                                                : 'border-slate-200 bg-white'
                                        }`}
                                    >
                                        <div>
                                            <div className="mb-2 flex items-center justify-between gap-2">
                                                <h5 className="font-bold text-[#2C5F7C]">
                                                    {diag.afeccion.nombre}
                                                </h5>
                                                <span
                                                    className={`rounded-md px-2.5 py-1 text-xs font-bold ${getPctBadgeClass(
                                                        diag.porcentajeCoincidencia
                                                    )}`}
                                                >
                                                    {diag.porcentajeCoincidencia}%
                                                </span>
                                            </div>
                                            <p className="mb-3 text-xs leading-relaxed text-slate-500">
                                                {desc}
                                                {desc.length === 100 ? '...' : ''}
                                            </p>
                                        </div>
                                        <Link
                                            href={`/afecciones/${diag.afeccion._id}`}
                                            className="text-xs font-semibold text-[#5FD4A6] hover:text-[#2C5F7C]"
                                        >
                                            Ver más detalles &rarr;
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Final Actions */}
            <div className="flex flex-col justify-center gap-4 py-4 sm:flex-row">
                <Link
                    href="/consulta"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#5FD4A6] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#4ab88c]"
                >
                    <i className="fas fa-plus" /> Nueva Consulta
                </Link>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2C5F7C] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#1e4357]"
                >
                    <i className="fas fa-home" /> Ir al Dashboard
                </Link>
            </div>

            <ImageModal
                imagePath={modalImage}
                onClose={() => setModalImage(null)}
            />
        </div>
    );
}

export default function ResultadoPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFB]">
            <Navbar title="Resultado del Diagnóstico" />
            <main className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
                <Suspense
                    fallback={
                        <div className="py-20 text-center">
                            <i className="fas fa-spinner fa-spin text-4xl text-[#2C5F7C]" />
                        </div>
                    }
                >
                    <ResultadoContent />
                </Suspense>
            </main>
        </div>
    );
}
