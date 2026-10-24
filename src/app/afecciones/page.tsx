'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useApp } from '@/context/AppContext';

interface SintomaRef {
    _id: string;
    nombre: string;
    descripcion?: string;
}

interface AfeccionItem {
    _id: string;
    nombre: string;
    descripcion: string;
    severidad: 'leve' | 'moderada' | 'grave';
    zona: string;
    imagen?: string | null;
    sintomas: SintomaRef[];
    tratamiento?: string;
}

export default function AfeccionesPage() {
    const { user, fetchAPI, getImageUrl, showToast } = useApp();

    const [afecciones, setAfecciones] = useState<AfeccionItem[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [detalleModal, setDetalleModal] = useState<AfeccionItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(
        null
    );
    const [deleting, setDeleting] = useState(false);

    const cargarAfecciones = useCallback(
        async (searchQuery = '') => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (searchQuery.trim()) {
                    params.append('search', searchQuery.trim());
                }
                params.append('limit', '50');

                const res = await fetchAPI<{ success: boolean; data: AfeccionItem[] }>(
                    `/afecciones?${params.toString()}`
                );
                if (res && res.success) {
                    setAfecciones(res.data || []);
                }
            } catch (error) {
                console.error('Error cargando afecciones:', error);
            } finally {
                setLoading(false);
            }
        },
        [fetchAPI]
    );

    useEffect(() => {
        if (!user) return;
        const timer = setTimeout(() => {
            cargarAfecciones(search);
        }, 250);
        return () => clearTimeout(timer);
    }, [user, search, cargarAfecciones]);

    const handleResetFilters = () => {
        setSearch('');
        showToast('Búsqueda limpiada', 'info');
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetchAPI<{ success: boolean; message?: string }>(
                `/afecciones/${deleteTarget.id}`,
                { method: 'DELETE' }
            );
            if (res && res.success) {
                showToast('Afección eliminada exitosamente', 'success');
                setDeleteTarget(null);
                cargarAfecciones(search);
            } else {
                showToast(res?.message || 'Error al eliminar la afección', 'error');
            }
        } catch (error) {
            console.error('Error eliminando afección:', error);
        } finally {
            setDeleting(false);
        }
    };

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
            <Navbar title="Gestión de Afecciones" />

            <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
                {/* Breadcrumb */}
                <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                    <Link href="/dashboard" className="hover:text-[#2C5F7C]">
                        <i className="fas fa-home mr-1" /> Dashboard
                    </Link>
                    <span>/</span>
                    <span className="font-medium text-slate-700">Afecciones</span>
                </nav>

                {/* Page Header */}
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-[#2C5F7C]">
                            Gestión de Afecciones Dermatológicas
                        </h2>
                        <p className="text-sm text-slate-500">
                            Administra las afecciones registradas en el sistema
                        </p>
                    </div>
                    <Link
                        href="/afecciones/formulario"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#5FD4A6] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#4ab88c]"
                    >
                        <i className="fas fa-plus" /> Nueva Afección
                    </Link>
                </div>

                {/* Search & Controls */}
                <div className="mb-8 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <i className="fas fa-search absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nombre o descripción de afección..."
                            className="w-full rounded-lg border border-slate-200 py-2.5 pr-4 pl-11 text-sm text-slate-800 focus:border-[#2C5F7C] focus:ring-3 focus:ring-[#2C5F7C]/15 focus:outline-none"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                        <i className="fas fa-redo" /> Limpiar
                    </button>
                </div>

                {/* Grid of Conditions */}
                {loading ? (
                    <div className="py-16 text-center">
                        <i className="fas fa-spinner fa-spin text-4xl text-[#2C5F7C]" />
                        <p className="mt-3 text-slate-400">Cargando afecciones...</p>
                    </div>
                ) : afecciones.length === 0 ? (
                    <div className="rounded-xl bg-white p-12 text-center shadow-sm">
                        <i className="fas fa-search mb-3 block text-5xl text-slate-300" />
                        <h3 className="text-lg font-semibold text-slate-700">
                            No se encontraron afecciones
                        </h3>
                        <p className="mt-1 mb-6 text-sm text-slate-400">
                            Intente con otros criterios de búsqueda o cree una nueva afección
                        </p>
                        <Link
                            href="/afecciones/formulario"
                            className="inline-flex items-center gap-2 rounded-lg bg-[#5FD4A6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4ab88c]"
                        >
                            <i className="fas fa-plus" /> Nueva Afección
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {afecciones.map((afeccion) => {
                            const cantidadSintomas = afeccion.sintomas?.length || 0;
                            const descCorta =
                                afeccion.descripcion && afeccion.descripcion.length > 120
                                    ? afeccion.descripcion.substring(0, 120) + '...'
                                    : afeccion.descripcion || 'Sin descripción';

                            return (
                                <div
                                    key={afeccion._id}
                                    className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                                >
                                    {/* Image Header */}
                                    <div className="relative h-44 w-full bg-gradient-to-br from-[#2C5F7C] to-[#5FD4A6] overflow-hidden">
                                        {afeccion.imagen ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={getImageUrl(afeccion.imagen)}
                                                alt={afeccion.nombre}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-white">
                                                <i className="fas fa-notes-medical mb-2 text-3xl opacity-80" />
                                                <span className="font-semibold text-sm line-clamp-2">
                                                    {afeccion.nombre}
                                                </span>
                                            </div>
                                        )}
                                        <span
                                            className={`absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-bold uppercase shadow-xs backdrop-blur-xs bg-white/90 ${getSeveridadBadge(
                                                afeccion.severidad
                                            )}`}
                                        >
                                            {afeccion.severidad}
                                        </span>
                                    </div>

                                    {/* Card Body */}
                                    <div className="flex flex-1 flex-col justify-between p-5">
                                        <div>
                                            <h4 className="text-lg font-bold text-[#2C5F7C]">
                                                {afeccion.nombre}
                                            </h4>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                {descCorta}
                                            </p>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <i className="fas fa-heartbeat text-[#5FD4A6]" />
                                                {cantidadSintomas} síntoma
                                                {cantidadSintomas !== 1 ? 's' : ''}
                                            </span>
                                            <span className="capitalize">
                                                <i className="fas fa-map-marker-alt mr-1 text-[#4A9EBF]" />
                                                {afeccion.zona}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Actions */}
                                    <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                                        <button
                                            type="button"
                                            onClick={() => setDetalleModal(afeccion)}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[#2C5F7C] hover:text-[#2C5F7C] cursor-pointer"
                                        >
                                            <i className="fas fa-eye" /> Ver
                                        </button>
                                        <Link
                                            href={`/afecciones/formulario?id=${afeccion._id}`}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2C5F7C] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1e4357]"
                                        >
                                            <i className="fas fa-edit" /> Editar
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setDeleteTarget({
                                                    id: afeccion._id,
                                                    nombre: afeccion.nombre,
                                                })
                                            }
                                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#FF6B6B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#e05555] cursor-pointer"
                                            title="Eliminar afección"
                                        >
                                            <i className="fas fa-trash" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Quick View Detail Modal */}
            {detalleModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
                    onClick={() => setDetalleModal(null)}
                >
                    <div
                        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between bg-[#2C5F7C] px-6 py-4 text-white">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                                <i className="fas fa-notes-medical" /> {detalleModal.nombre}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setDetalleModal(null)}
                                className="text-white/80 hover:text-white cursor-pointer"
                            >
                                <i className="fas fa-times text-xl" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {detalleModal.imagen && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={getImageUrl(detalleModal.imagen)}
                                    alt={detalleModal.nombre}
                                    className="max-h-64 w-full rounded-xl object-cover shadow-xs"
                                />
                            )}

                            <div>
                                <h4 className="mb-1.5 flex items-center gap-2 font-semibold text-[#2C5F7C]">
                                    <i className="fas fa-info-circle" /> Descripción
                                </h4>
                                <p className="text-sm leading-relaxed text-slate-600">
                                    {detalleModal.descripcion}
                                </p>
                            </div>

                            <div>
                                <h4 className="mb-2 flex items-center gap-2 font-semibold text-[#2C5F7C]">
                                    <i className="fas fa-list-check" /> Síntomas Asociados (
                                    {detalleModal.sintomas?.length || 0})
                                </h4>
                                {detalleModal.sintomas && detalleModal.sintomas.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {detalleModal.sintomas.map((s) => (
                                            <span
                                                key={s._id}
                                                className="inline-flex items-center gap-1.5 rounded-full bg-[#5FD4A6]/15 px-3 py-1 text-xs font-semibold text-[#2d8a68]"
                                            >
                                                <i className="fas fa-check-circle" />
                                                {s.nombre}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400">
                                        No hay síntomas asociados
                                    </p>
                                )}
                            </div>

                            {detalleModal.tratamiento && (
                                <div>
                                    <h4 className="mb-1.5 flex items-center gap-2 font-semibold text-[#2C5F7C]">
                                        <i className="fas fa-pills" /> Tratamiento Recomendado
                                    </h4>
                                    <p className="text-sm leading-relaxed text-slate-600">
                                        {detalleModal.tratamiento}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setDetalleModal(null)}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                                Cerrar
                            </button>
                            <Link
                                href={`/afecciones/${detalleModal._id}`}
                                className="rounded-lg bg-[#4A9EBF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3d89a8]"
                            >
                                Ver Página Completa
                            </Link>
                            <Link
                                href={`/afecciones/formulario?id=${detalleModal._id}`}
                                className="rounded-lg bg-[#2C5F7C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e4357]"
                            >
                                <i className="fas fa-edit mr-1" /> Editar
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
                    onClick={() => setDeleteTarget(null)}
                >
                    <div
                        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-gradient-to-r from-[#e74c3c] to-[#c0392b] px-6 py-4 text-white">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                                <i className="fas fa-exclamation-triangle" /> Confirmar Eliminación
                            </h3>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-slate-700">
                                ¿Está seguro que desea eliminar la siguiente afección?
                            </p>
                            <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 font-semibold text-amber-900">
                                <i className="fas fa-notes-medical mr-2" />
                                {deleteTarget.nombre}
                            </div>
                            <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">
                                <i className="fas fa-exclamation-circle mr-1.5" />
                                Esta acción eliminará permanentemente la afección y no se puede
                                deshacer.
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleConfirmDelete}
                                className="rounded-lg bg-[#e74c3c] px-5 py-2 text-sm font-semibold text-white hover:bg-[#c0392b] disabled:opacity-60 cursor-pointer"
                            >
                                <i className="fas fa-trash mr-1.5" />
                                {deleting ? 'Eliminando...' : 'Eliminar Permanentemente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
