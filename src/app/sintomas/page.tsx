'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useApp } from '@/context/AppContext';

interface SintomaItem {
    _id: string;
    nombre: string;
    descripcion?: string;
    zona: string;
}

export default function SintomasPage() {
    const { user, fetchAPI, showToast } = useApp();

    const [sintomas, setSintomas] = useState<SintomaItem[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Create/Edit Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [zona, setZona] = useState('todas');
    const [saving, setSaving] = useState(false);

    // Delete Modal State
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(
        null
    );
    const [deleting, setDeleting] = useState(false);

    const cargarSintomas = useCallback(
        async (searchQuery = '') => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (searchQuery.trim()) {
                    params.append('search', searchQuery.trim());
                }
                const res = await fetchAPI<{ success: boolean; data: SintomaItem[] }>(
                    `/sintomas?${params.toString()}`
                );
                if (res && res.success) {
                    setSintomas(res.data || []);
                }
            } catch (error) {
                console.error('Error cargando síntomas:', error);
            } finally {
                setLoading(false);
            }
        },
        [fetchAPI]
    );

    useEffect(() => {
        if (!user) return;
        const timer = setTimeout(() => {
            cargarSintomas(search);
        }, 250);
        return () => clearTimeout(timer);
    }, [user, search, cargarSintomas]);

    const openCreateModal = () => {
        setEditingId(null);
        setNombre('');
        setDescripcion('');
        setZona('todas');
        setModalOpen(true);
    };

    const openEditModal = (sintoma: SintomaItem) => {
        setEditingId(sintoma._id);
        setNombre(sintoma.nombre);
        setDescripcion(sintoma.descripcion || '');
        setZona(sintoma.zona || 'todas');
        setModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedNombre = nombre.trim();
        const trimmedDesc = descripcion.trim();

        if (!trimmedNombre) {
            showToast('El nombre del síntoma es requerido', 'error');
            return;
        }
        if (trimmedNombre.length < 3) {
            showToast('El nombre debe tener al menos 3 caracteres', 'error');
            return;
        }

        setSaving(true);
        try {
            const endpoint = editingId ? `/sintomas/${editingId}` : '/sintomas';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetchAPI<{ success: boolean; message?: string }>(endpoint, {
                method,
                body: JSON.stringify({
                    nombre: trimmedNombre,
                    descripcion: trimmedDesc,
                    zona,
                }),
            });

            if (res && res.success) {
                showToast(
                    editingId
                        ? 'Síntoma actualizado exitosamente'
                        : 'Síntoma creado exitosamente',
                    'success'
                );
                setModalOpen(false);
                cargarSintomas(search);
            } else {
                showToast(res?.message || 'Error al guardar el síntoma', 'error');
            }
        } catch (error) {
            console.error('Error guardando síntoma:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetchAPI<{ success: boolean; message?: string }>(
                `/sintomas/${deleteTarget.id}`,
                { method: 'DELETE' }
            );
            if (res && res.success) {
                showToast(`Síntoma "${deleteTarget.nombre}" eliminado exitosamente`, 'success');
                setDeleteTarget(null);
                cargarSintomas(search);
            } else {
                showToast(res?.message || 'Error al eliminar el síntoma', 'error');
            }
        } catch (error) {
            console.error('Error eliminando síntoma:', error);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFB]">
            <Navbar title="Gestión de Síntomas" />

            <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
                <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                    <Link href="/dashboard" className="hover:text-[#2C5F7C]">
                        <i className="fas fa-home mr-1" /> Dashboard
                    </Link>
                    <span>/</span>
                    <span className="font-medium text-slate-700">Síntomas</span>
                </nav>

                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-[#2C5F7C]">
                            Gestión de Síntomas
                        </h2>
                        <p className="text-sm text-slate-500">
                            Administra los síntomas disponibles en el sistema
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#5FD4A6] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4ab88c] cursor-pointer"
                    >
                        <i className="fas fa-plus" /> Nuevo Síntoma
                    </button>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm space-y-5">
                    <div className="relative">
                        <i className="fas fa-search absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar síntomas..."
                            className="w-full rounded-lg border border-slate-200 py-2.5 pr-4 pl-11 text-sm text-slate-800 focus:border-[#2C5F7C] focus:ring-3 focus:ring-[#2C5F7C]/15 focus:outline-none"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Síntoma</th>
                                    <th className="px-6 py-4">Descripción</th>
                                    <th className="px-6 py-4">Zona</th>
                                    <th className="px-6 py-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center">
                                            <i className="fas fa-spinner fa-spin text-3xl text-[#2C5F7C]" />
                                            <p className="mt-3 text-slate-400">
                                                Cargando síntomas...
                                            </p>
                                        </td>
                                    </tr>
                                ) : sintomas.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="py-12 text-center text-slate-400"
                                        >
                                            <i className="fas fa-search mb-2 block text-3xl opacity-40" />
                                            <p>No se encontraron síntomas</p>
                                        </td>
                                    </tr>
                                ) : (
                                    sintomas.map((sintoma) => (
                                        <tr
                                            key={sintoma._id}
                                            className="transition-colors hover:bg-slate-50/80"
                                        >
                                            <td className="px-6 py-4 font-semibold text-slate-800">
                                                {sintoma.nombre}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {sintoma.descripcion || 'Sin descripción'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex rounded-full bg-[#2C5F7C]/15 px-3 py-1 text-xs font-semibold uppercase text-[#2C5F7C]">
                                                    {sintoma.zona || 'todas'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(sintoma)}
                                                        title="Editar síntoma"
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF9F66] text-white transition-transform hover:scale-105 hover:bg-[#e88950] cursor-pointer"
                                                    >
                                                        <i className="fas fa-edit" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setDeleteTarget({
                                                                id: sintoma._id,
                                                                nombre: sintoma.nombre,
                                                            })
                                                        }
                                                        title="Eliminar síntoma"
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF6B6B] text-white transition-transform hover:scale-105 hover:bg-[#e05555] cursor-pointer"
                                                    >
                                                        <i className="fas fa-trash" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Create / Edit Modal */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
                    onClick={() => setModalOpen(false)}
                >
                    <div
                        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-[#2C5F7C]">
                                <i
                                    className={`fas ${
                                        editingId ? 'fa-edit' : 'fa-plus'
                                    } text-[#5FD4A6]`}
                                />
                                {editingId ? 'Editar Síntoma' : 'Nuevo Síntoma'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <i className="fas fa-times text-lg" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Nombre del Síntoma <span className="text-[#FF6B6B]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    maxLength={100}
                                    required
                                    placeholder="Ej: Picazón intensa"
                                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-[#2C5F7C] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Descripción
                                </label>
                                <textarea
                                    rows={3}
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    maxLength={500}
                                    placeholder="Descripción detallada del síntoma..."
                                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-[#2C5F7C] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Zona Afectada
                                </label>
                                <select
                                    value={zona}
                                    onChange={(e) => setZona(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-[#2C5F7C] focus:outline-none"
                                >
                                    <option value="todas">Todas las zonas</option>
                                    <option value="rostro">Rostro</option>
                                    <option value="cuero-cabelludo">Cuero Cabelludo</option>
                                    <option value="cuello">Cuello</option>
                                    <option value="tronco">Tronco</option>
                                    <option value="abdomen">Abdomen</option>
                                    <option value="brazos">Brazos</option>
                                    <option value="manos">Manos</option>
                                    <option value="piernas">Piernas</option>
                                    <option value="pies">Pies</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#5FD4A6] px-5 py-2 text-sm font-semibold text-white hover:bg-[#4ab88c] disabled:opacity-60 cursor-pointer"
                                >
                                    <i className="fas fa-save" />
                                    {saving ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
                    onClick={() => setDeleteTarget(null)}
                >
                    <div
                        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between bg-[#FF6B6B] px-6 py-4 text-white">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                                <i className="fas fa-exclamation-triangle" /> Confirmar Eliminación
                            </h3>
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="text-white/80 hover:text-white cursor-pointer"
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-slate-700">
                                ¿Está seguro que desea eliminar el síntoma{' '}
                                <strong>&ldquo;{deleteTarget.nombre}&rdquo;</strong>?
                            </p>
                            <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 text-xs text-amber-800">
                                <i className="fas fa-info-circle mr-1.5" />
                                <strong>Advertencia:</strong> Esta acción no se puede deshacer.
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
                                className="rounded-lg bg-[#FF6B6B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e05555] disabled:opacity-60 cursor-pointer"
                            >
                                <i className="fas fa-trash mr-1.5" />
                                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
