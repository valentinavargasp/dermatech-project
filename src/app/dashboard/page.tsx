'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ImageModal from '@/components/ImageModal';
import { useApp } from '@/context/AppContext';

interface ConsultaReciente {
    _id: string;
    nombrePaciente: string;
    imagenZona?: string | null;
    createdAt: string;
    diagnosticoPrincipal?: {
        _id: string;
        nombre: string;
        severidad: 'leve' | 'moderada' | 'grave';
    } | null;
    usuario?: {
        username: string;
    };
}

interface EstadisticasResponse {
    success: boolean;
    data: {
        totalAfecciones: number;
        totalSintomas: number;
        totalConsultas: number;
        consultasRecientes: ConsultaReciente[];
    };
}

export default function DashboardPage() {
    const { user, fetchAPI, showToast } = useApp();
    const router = useRouter();

    const [stats, setStats] = useState({
        totalAfecciones: 0,
        totalConsultas: 0,
        totalSintomas: 0,
    });
    const [consultasRecientes, setConsultasRecientes] = useState<ConsultaReciente[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDateStr, setCurrentDateStr] = useState('');
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [consultaToDelete, setConsultaToDelete] = useState<{
        id: string;
        nombrePaciente: string;
    } | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        setCurrentDateStr(
            new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })
        );
    }, []);

    const cargarEstadisticas = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetchAPI<EstadisticasResponse>('/estadisticas');
            if (res && res.success) {
                setStats({
                    totalAfecciones: res.data.totalAfecciones || 0,
                    totalConsultas: res.data.totalConsultas || 0,
                    totalSintomas: res.data.totalSintomas || 0,
                });
                setConsultasRecientes(res.data.consultasRecientes || []);
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        } finally {
            setLoading(false);
        }
    }, [fetchAPI]);

    useEffect(() => {
        if (user) {
            cargarEstadisticas();
        }
    }, [user, cargarEstadisticas]);

    const handleConfirmDelete = async () => {
        if (!consultaToDelete) return;
        setDeleting(true);
        try {
            const res = await fetchAPI<{ success: boolean; message?: string }>(
                `/consultas/${consultaToDelete.id}`,
                { method: 'DELETE' }
            );
            if (res && res.success) {
                showToast('Consulta eliminada exitosamente', 'success');
                setConsultaToDelete(null);
                await cargarEstadisticas();
            } else {
                showToast(res?.message || 'Error al eliminar la consulta', 'error');
            }
        } catch (error) {
            console.error('Error eliminando consulta:', error);
        } finally {
            setDeleting(false);
        }
    };

    const getSeveridadBadge = (severidad?: string) => {
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
            <Navbar />

            <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
                {/* Welcome Banner */}
                <section className="mb-8 flex flex-col items-center justify-between gap-4 rounded-xl bg-gradient-to-br from-[#2C5F7C] to-[#4A9EBF] p-6 text-white shadow-md md:flex-row">
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">
                            Bienvenido, <span className="capitalize">{user?.username || 'Usuario'}</span>
                        </h2>
                        <p className="mt-1 text-white/90">
                            Gestiona diagnósticos dermatológicos de manera eficiente y profesional
                        </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-xs">
                        <i className="fas fa-calendar-alt" />
                        <span className="capitalize">{currentDateStr}</span>
                    </div>
                </section>

                {/* Statistics Cards */}
                <section className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div className="flex items-center gap-5 rounded-xl border-l-4 border-[#2C5F7C] bg-white p-6 shadow-sm transition-transform hover:-translate-y-1">
                        <div className="flex h-15 w-15 shrink-0 items-center justify-center rounded-xl bg-[#2C5F7C]/10 text-2xl text-[#2C5F7C]">
                            <i className="fas fa-notes-medical" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-slate-800">
                                {stats.totalAfecciones}
                            </h3>
                            <p className="text-sm text-slate-500">Afecciones Registradas</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-5 rounded-xl border-l-4 border-[#4A9EBF] bg-white p-6 shadow-sm transition-transform hover:-translate-y-1">
                        <div className="flex h-15 w-15 shrink-0 items-center justify-center rounded-xl bg-[#4A9EBF]/10 text-2xl text-[#4A9EBF]">
                            <i className="fas fa-stethoscope" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-slate-800">
                                {stats.totalConsultas}
                            </h3>
                            <p className="text-sm text-slate-500">Total Consultas</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-5 rounded-xl border-l-4 border-[#5FD4A6] bg-white p-6 shadow-sm transition-transform hover:-translate-y-1">
                        <div className="flex h-15 w-15 shrink-0 items-center justify-center rounded-xl bg-[#5FD4A6]/15 text-2xl text-[#5FD4A6]">
                            <i className="fas fa-list-check" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-slate-800">
                                {stats.totalSintomas}
                            </h3>
                            <p className="text-sm text-slate-500">Síntomas en Base</p>
                        </div>
                    </div>
                </section>

                {/* Quick Actions */}
                <section className="mb-10">
                    <h3 className="mb-5 text-xl font-semibold text-slate-800">
                        Acciones Rápidas
                    </h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <Link
                            href="/consulta"
                            className="group flex flex-col items-center rounded-xl border-2 border-[#5FD4A6] bg-gradient-to-br from-[#5FD4A6]/5 to-[#5FD4A6]/15 p-7 text-center shadow-sm transition-all hover:-translate-y-2 hover:shadow-lg"
                        >
                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#5FD4A6] to-[#4ab88c] text-3xl text-white shadow-md transition-transform group-hover:scale-110">
                                <i className="fas fa-stethoscope" />
                            </div>
                            <h4 className="text-lg font-semibold text-slate-800">Nueva Consulta</h4>
                            <p className="mt-1 mb-4 text-sm text-slate-500">
                                Realizar nuevo diagnóstico
                            </p>
                            <span className="text-[#2C5F7C] transition-transform group-hover:translate-x-1.5">
                                <i className="fas fa-arrow-right text-lg" />
                            </span>
                        </Link>

                        <Link
                            href="/afecciones"
                            className="group flex flex-col items-center rounded-xl bg-white p-7 text-center shadow-sm transition-all hover:-translate-y-2 hover:shadow-lg"
                        >
                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#2C5F7C] to-[#4A9EBF] text-3xl text-white shadow-md transition-transform group-hover:scale-110">
                                <i className="fas fa-notes-medical" />
                            </div>
                            <h4 className="text-lg font-semibold text-slate-800">
                                Gestionar Afecciones
                            </h4>
                            <p className="mt-1 mb-4 text-sm text-slate-500">
                                Ver y editar afecciones
                            </p>
                            <span className="text-[#2C5F7C] transition-transform group-hover:translate-x-1.5">
                                <i className="fas fa-arrow-right text-lg" />
                            </span>
                        </Link>

                        <Link
                            href="/sintomas"
                            className="group flex flex-col items-center rounded-xl bg-white p-7 text-center shadow-sm transition-all hover:-translate-y-2 hover:shadow-lg"
                        >
                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#2C5F7C] to-[#4A9EBF] text-3xl text-white shadow-md transition-transform group-hover:scale-110">
                                <i className="fas fa-list-check" />
                            </div>
                            <h4 className="text-lg font-semibold text-slate-800">
                                Gestionar Síntomas
                            </h4>
                            <p className="mt-1 mb-4 text-sm text-slate-500">
                                Administrar síntomas
                            </p>
                            <span className="text-[#2C5F7C] transition-transform group-hover:translate-x-1.5">
                                <i className="fas fa-arrow-right text-lg" />
                            </span>
                        </Link>
                    </div>
                </section>

                {/* Recent Consultations Table */}
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-xl font-semibold text-slate-800">
                            <i className="fas fa-history text-[#2C5F7C]" /> Consultas Recientes
                        </h3>
                    </div>

                    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Paciente</th>
                                        <th className="px-6 py-4">Diagnóstico</th>
                                        <th className="px-6 py-4">Severidad</th>
                                        <th className="px-6 py-4">Imagen</th>
                                        <th className="px-6 py-4">Fecha</th>
                                        <th className="px-6 py-4">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center">
                                                <i className="fas fa-spinner fa-spin text-3xl text-[#2C5F7C]" />
                                                <p className="mt-3 text-slate-400">
                                                    Cargando consultas...
                                                </p>
                                            </td>
                                        </tr>
                                    ) : consultasRecientes.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-slate-400">
                                                <i className="fas fa-inbox mb-2 block text-3xl opacity-40" />
                                                <p>No hay consultas recientes</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        consultasRecientes.map((consulta) => {
                                            const severidad =
                                                consulta.diagnosticoPrincipal?.severidad || 'moderada';
                                            const diagnosticoNombre =
                                                consulta.diagnosticoPrincipal?.nombre || 'Análisis IA';
                                            const fecha = new Date(
                                                consulta.createdAt
                                            ).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            });

                                            return (
                                                <tr
                                                    key={consulta._id}
                                                    className="transition-colors hover:bg-slate-50/80"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-slate-800">
                                                            {consulta.nombrePaciente || 'Sin nombre'}
                                                        </div>
                                                        <div className="text-xs text-slate-400">
                                                            Por: {consulta.usuario?.username || 'Usuario'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium">
                                                        {diagnosticoNombre}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${getSeveridadBadge(
                                                                severidad
                                                            )}`}
                                                        >
                                                            {severidad}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {consulta.imagenZona ? (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setModalImage(consulta.imagenZona!)
                                                                }
                                                                className="inline-flex items-center gap-1.5 rounded-md bg-[#5FD4A6] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#4ab88c] cursor-pointer"
                                                            >
                                                                <i className="fas fa-image" /> Ver
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">
                                                                Sin imagen
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500">{fecha}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    router.push(
                                                                        `/resultado?id=${consulta._id}`
                                                                    )
                                                                }
                                                                title="Ver detalles"
                                                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2C5F7C] text-white transition-transform hover:scale-105 hover:bg-[#1e4357] cursor-pointer"
                                                            >
                                                                <i className="fas fa-eye" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setConsultaToDelete({
                                                                        id: consulta._id,
                                                                        nombrePaciente:
                                                                            consulta.nombrePaciente,
                                                                    })
                                                                }
                                                                title="Eliminar consulta"
                                                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF6B6B] text-white transition-transform hover:scale-105 hover:bg-[#e05555] cursor-pointer"
                                                            >
                                                                <i className="fas fa-trash" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </main>

            {/* Image Preview Modal */}
            <ImageModal
                imagePath={modalImage}
                onClose={() => setModalImage(null)}
            />

            {/* Delete Confirmation Modal */}
            {consultaToDelete && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
                    onClick={() => setConsultaToDelete(null)}
                >
                    <div
                        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                <i className="fas fa-exclamation-triangle text-[#FF6B6B]" />
                                Confirmar Eliminación
                            </h3>
                            <button
                                type="button"
                                onClick={() => setConsultaToDelete(null)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <i className="fas fa-times text-lg" />
                            </button>
                        </div>

                        <div className="my-5 space-y-3 text-slate-600">
                            <p>
                                ¿Está seguro que desea eliminar la consulta del paciente{' '}
                                <strong className="text-slate-800">
                                    &ldquo;{consultaToDelete.nombrePaciente}&rdquo;
                                </strong>
                                ?
                            </p>
                            <p className="text-sm text-[#FF6B6B]">
                                <i className="fas fa-info-circle mr-1" /> Esta acción no se puede
                                deshacer.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setConsultaToDelete(null)}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleConfirmDelete}
                                className="rounded-lg bg-[#FF6B6B] px-4 py-2 text-sm font-medium text-white hover:bg-[#e05555] disabled:opacity-60 cursor-pointer"
                            >
                                <i className="fas fa-trash mr-1.5" />
                                {deleting ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
