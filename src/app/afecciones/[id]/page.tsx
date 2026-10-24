'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useApp } from '@/context/AppContext';

interface Sintoma {
    _id: string;
    nombre: string;
    descripcion?: string;
    zona?: string;
}

interface AfeccionDetalle {
    _id: string;
    nombre: string;
    descripcion: string;
    severidad: 'leve' | 'moderada' | 'grave';
    zona: string;
    imagen?: string | null;
    sintomas: Sintoma[];
    tratamiento?: string;
    createdAt: string;
    updatedAt: string;
}

export default function AfeccionDetallePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { fetchAPI, getImageUrl, showToast } = useApp();
    const router = useRouter();

    const [afeccion, setAfeccion] = useState<AfeccionDetalle | null>(null);
    const [loading, setLoading] = useState(true);

    const cargarAfeccion = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetchAPI<{ success: boolean; data: AfeccionDetalle }>(
                `/afecciones/${id}`
            );
            if (res && res.success && res.data) {
                setAfeccion(res.data);
            } else {
                showToast('No se encontró la afección', 'error');
            }
        } catch (error) {
            console.error('Error cargando afección:', error);
        } finally {
            setLoading(false);
        }
    }, [id, fetchAPI, showToast]);

    useEffect(() => {
        cargarAfeccion();
    }, [cargarAfeccion]);

    const getSeveridadBadge = (severidad: string) => {
        switch (severidad) {
            case 'leve':
                return 'bg-[#5FD4A6]/15 text-[#2d8a68]';
            case 'grave':
                return 'bg-[#FF6B6B]/15 text-[#cc3636]';
            default:
                return 'bg-[#FF9F66]/15 text-[#cc6d2d]';
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFB]">
            <Navbar title="Detalle de Afección" />

            <main className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
                <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
                    <Link href="/dashboard" className="hover:text-[#2C5F7C]">
                        <i className="fas fa-home mr-1" /> Dashboard
                    </Link>
                    <span>/</span>
                    <Link href="/afecciones" className="hover:text-[#2C5F7C]">
                        Afecciones
                    </Link>
                    <span>/</span>
                    <span className="font-medium text-slate-700">
                        {afeccion?.nombre || 'Detalle'}
                    </span>
                </nav>

                {loading ? (
                    <div className="py-20 text-center">
                        <i className="fas fa-spinner fa-spin text-4xl text-[#2C5F7C]" />
                        <p className="mt-3 text-slate-400">Cargando detalle de afección...</p>
                    </div>
                ) : !afeccion ? (
                    <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                        <i className="fas fa-exclamation-triangle mb-3 text-4xl text-[#FF6B6B]" />
                        <h3 className="text-xl font-bold text-slate-800">
                            Afección no encontrada
                        </h3>
                        <Link
                            href="/afecciones"
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#2C5F7C] px-5 py-2.5 text-sm font-semibold text-white"
                        >
                            <i className="fas fa-arrow-left" /> Volver a Afecciones
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {/* Left Column: Image & Actions */}
                        <div className="space-y-4">
                            <div className="overflow-hidden rounded-xl bg-white p-4 shadow-sm">
                                {afeccion.imagen ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={getImageUrl(afeccion.imagen)}
                                        alt={afeccion.nombre}
                                        className="w-full rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="flex h-60 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-[#2C5F7C] to-[#5FD4A6] p-6 text-center text-white">
                                        <i className="fas fa-notes-medical mb-3 text-4xl opacity-80" />
                                        <span className="font-bold">{afeccion.nombre}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                <Link
                                    href={`/afecciones/formulario?id=${afeccion._id}`}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2C5F7C] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1e4357]"
                                >
                                    <i className="fas fa-edit" /> Editar Afección
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                    <i className="fas fa-arrow-left" /> Volver
                                </button>
                            </div>
                        </div>

                        {/* Right Column: Content */}
                        <div className="md:col-span-2">
                            <div className="rounded-xl bg-white p-6 sm:p-8 shadow-sm space-y-6">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                                    <h2 className="text-2xl font-bold text-[#2C5F7C]">
                                        {afeccion.nombre}
                                    </h2>
                                    <span
                                        className={`rounded-full px-3.5 py-1 text-xs font-bold uppercase ${getSeveridadBadge(
                                            afeccion.severidad
                                        )}`}
                                    >
                                        {afeccion.severidad}
                                    </span>
                                </div>

                                <div>
                                    <h4 className="mb-2 flex items-center gap-2 text-base font-semibold text-[#2C5F7C]">
                                        <i className="fas fa-file-alt" /> Descripción
                                    </h4>
                                    <p className="leading-relaxed text-slate-600">
                                        {afeccion.descripcion}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="mb-3 flex items-center gap-2 text-base font-semibold text-[#2C5F7C]">
                                        <i className="fas fa-heartbeat" /> Síntomas Asociados (
                                        {afeccion.sintomas?.length || 0})
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                        {afeccion.sintomas?.map((s) => (
                                            <div
                                                key={s._id}
                                                className="flex items-center gap-2 rounded-lg border-2 border-[#5FD4A6] bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700"
                                            >
                                                <i className="fas fa-check-circle text-[#5FD4A6]" />
                                                <span>{s.nombre}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {afeccion.tratamiento && (
                                    <div>
                                        <h4 className="mb-2 flex items-center gap-2 text-base font-semibold text-[#2C5F7C]">
                                            <i className="fas fa-pills" /> Tratamiento Recomendado
                                        </h4>
                                        <div className="rounded-xl border-l-4 border-[#5FD4A6] bg-[#5FD4A6]/5 p-4">
                                            <p className="leading-relaxed text-slate-700">
                                                {afeccion.tratamiento}
                                            </p>
                                            <p className="mt-3 text-xs text-slate-400">
                                                <i className="fas fa-exclamation-triangle mr-1 text-amber-500" />
                                                Esta información es referencial. Siempre consulte
                                                con un profesional de la salud.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <i className="fas fa-map-marker-alt text-[#4A9EBF]" />
                                        <span className="capitalize">
                                            Zona afectada: <strong>{afeccion.zona}</strong>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <i className="fas fa-calendar text-[#4A9EBF]" />
                                        <span>
                                            Última actualización:{' '}
                                            {new Date(afeccion.updatedAt).toLocaleDateString(
                                                'es-ES'
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
