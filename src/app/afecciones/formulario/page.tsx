'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useApp } from '@/context/AppContext';

interface SintomaOption {
    _id: string;
    nombre: string;
}

function AfeccionFormContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { fetchAPI, fetchAPIFormData, getImageUrl, showToast } = useApp();

    const afeccionId = searchParams.get('id');

    const [nombre, setNombre] = useState('');
    const [severidad, setSeveridad] = useState('');
    const [zona, setZona] = useState('todas');
    const [descripcion, setDescripcion] = useState('');
    const [tratamiento, setTratamiento] = useState('');

    const [sintomasDisponibles, setSintomasDisponibles] = useState<SintomaOption[]>([]);
    const [selectedSintomas, setSelectedSintomas] = useState<string[]>([]);
    const [searchSintoma, setSearchSintoma] = useState('');

    const [imagenFile, setImagenFile] = useState<File | null>(null);
    const [imagenPreview, setImagenPreview] = useState<string | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [saving, setSaving] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const cargarDatos = useCallback(async () => {
        try {
            setLoadingData(true);
            const sintomasRes = await fetchAPI<{ success: boolean; data: SintomaOption[] }>(
                '/sintomas'
            );
            if (sintomasRes && sintomasRes.success) {
                setSintomasDisponibles(sintomasRes.data || []);
            }

            if (afeccionId) {
                const afeccionRes = await fetchAPI<{
                    success: boolean;
                    data: {
                        nombre: string;
                        descripcion: string;
                        severidad: string;
                        zona: string;
                        tratamiento?: string;
                        imagen?: string | null;
                        sintomas: Array<{ _id: string } | string>;
                    };
                }>(`/afecciones/${afeccionId}`);

                if (afeccionRes && afeccionRes.success && afeccionRes.data) {
                    const af = afeccionRes.data;
                    setNombre(af.nombre || '');
                    setDescripcion(af.descripcion || '');
                    setSeveridad(af.severidad || '');
                    setZona(af.zona || 'todas');
                    setTratamiento(af.tratamiento || '');
                    if (af.imagen) {
                        setImagenPreview(getImageUrl(af.imagen));
                    }
                    const ids = (af.sintomas || []).map((s) =>
                        typeof s === 'string' ? s : s._id
                    );
                    setSelectedSintomas(ids);
                }
            }
        } catch (error) {
            console.error('Error cargando datos del formulario:', error);
        } finally {
            setLoadingData(false);
        }
    }, [afeccionId, fetchAPI, getImageUrl]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            showToast('Por favor selecciona una imagen válida (PNG, JPG)', 'error');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('La imagen no debe superar los 5MB', 'error');
            return;
        }
        setImagenFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagenPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        showToast('Imagen cargada correctamente', 'success');
    };

    const toggleSintoma = (id: string) => {
        setSelectedSintomas((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nombre.trim()) {
            showToast('El nombre es requerido', 'error');
            return;
        }
        if (!descripcion.trim()) {
            showToast('La descripción es requerida', 'error');
            return;
        }
        if (!severidad) {
            showToast('La severidad es requerida', 'error');
            return;
        }
        if (selectedSintomas.length === 0) {
            showToast('Debe seleccionar al menos un síntoma', 'error');
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('nombre', nombre.trim());
            formData.append('descripcion', descripcion.trim());
            formData.append('severidad', severidad);
            formData.append('zona', zona || 'todas');
            formData.append('tratamiento', tratamiento.trim());
            formData.append('sintomas', JSON.stringify(selectedSintomas));

            if (imagenFile) {
                formData.append('imagen', imagenFile);
            }

            const endpoint = afeccionId ? `/afecciones/${afeccionId}` : '/afecciones';
            const method = afeccionId ? 'PUT' : 'POST';

            const res = await fetchAPIFormData<{ success: boolean; message?: string }>(
                endpoint,
                formData,
                method
            );

            if (res && res.success) {
                showToast(
                    afeccionId
                        ? 'Afección actualizada exitosamente'
                        : 'Afección creada exitosamente',
                    'success'
                );
                setTimeout(() => {
                    router.push('/afecciones');
                }, 800);
            } else {
                showToast(res?.message || 'Error al guardar la afección', 'error');
                setSaving(false);
            }
        } catch (error) {
            console.error('Error guardando afección:', error);
            setSaving(false);
        }
    };

    const sintomasFiltrados = sintomasDisponibles.filter((s) =>
        s.nombre.toLowerCase().includes(searchSintoma.toLowerCase())
    );

    if (loadingData) {
        return (
            <div className="py-20 text-center">
                <i className="fas fa-spinner fa-spin text-4xl text-[#2C5F7C]" />
                <p className="mt-3 text-slate-400">Cargando formulario...</p>
            </div>
        );
    }

    return (
        <div>
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
                    {afeccionId ? 'Editar Afección' : 'Nueva Afección'}
                </span>
            </nav>

            <div className="rounded-xl bg-white p-6 sm:p-8 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Nombre de la Afección <span className="text-[#FF6B6B]">*</span>
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej: Dermatitis Atópica"
                            required
                            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-800 focus:border-[#2C5F7C] focus:ring-3 focus:ring-[#2C5F7C]/15 focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Severidad <span className="text-[#FF6B6B]">*</span>
                            </label>
                            <select
                                value={severidad}
                                onChange={(e) => setSeveridad(e.target.value)}
                                required
                                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-800 focus:border-[#2C5F7C] focus:ring-3 focus:ring-[#2C5F7C]/15 focus:outline-none"
                            >
                                <option value="">Seleccione una opción</option>
                                <option value="leve">Leve</option>
                                <option value="moderada">Moderada</option>
                                <option value="grave">Grave</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Zona Afectada
                            </label>
                            <select
                                value={zona}
                                onChange={(e) => setZona(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-800 focus:border-[#2C5F7C] focus:ring-3 focus:ring-[#2C5F7C]/15 focus:outline-none"
                            >
                                <option value="todas">Todas</option>
                                <option value="rostro">Rostro</option>
                                <option value="cuello">Cuello</option>
                                <option value="tronco">Tronco</option>
                                <option value="abdomen">Abdomen</option>
                                <option value="brazos">Brazos</option>
                                <option value="piernas">Piernas</option>
                                <option value="manos">Manos</option>
                                <option value="pies">Pies</option>
                                <option value="extremidades">Extremidades</option>
                                <option value="cuero-cabelludo">Cuero cabelludo</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Descripción Detallada <span className="text-[#FF6B6B]">*</span>
                        </label>
                        <textarea
                            rows={4}
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Describa la afección, sus características principales, síntomas comunes..."
                            required
                            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-800 focus:border-[#2C5F7C] focus:ring-3 focus:ring-[#2C5F7C]/15 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Imagen de la Afección{' '}
                            <span className="text-xs font-normal text-slate-400">
                                (Opcional - PNG, JPG hasta 5MB)
                            </span>
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(file);
                            }}
                        />

                        {!imagenPreview ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-8 text-center transition-colors hover:border-[#2C5F7C] hover:bg-slate-50"
                            >
                                <i className="fas fa-cloud-upload-alt mb-2 text-3xl text-[#4A9EBF]" />
                                <p className="text-sm font-medium text-slate-600">
                                    Arrastra una imagen aquí o haz clic para seleccionar
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Formatos: PNG, JPG, JPEG - Máximo 5MB
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 rounded-xl border border-slate-200 p-4 text-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={imagenPreview}
                                    alt="Preview"
                                    className="mx-auto max-h-60 rounded-lg object-contain"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImagenFile(null);
                                        setImagenPreview(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF6B6B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#e05555] cursor-pointer"
                                >
                                    <i className="fas fa-times" /> Eliminar imagen
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Síntomas Asociados ({selectedSintomas.length} seleccionados){' '}
                            <span className="text-[#FF6B6B]">*</span>
                        </label>
                        <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                            <div className="relative">
                                <i className="fas fa-search absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchSintoma}
                                    onChange={(e) => setSearchSintoma(e.target.value)}
                                    placeholder="Buscar síntomas..."
                                    className="w-full rounded-lg border border-slate-200 py-2 pr-4 pl-10 text-sm text-slate-800 focus:border-[#2C5F7C] focus:outline-none"
                                />
                            </div>
                            <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 md:grid-cols-3">
                                {sintomasFiltrados.map((s) => {
                                    const isChecked = selectedSintomas.includes(s._id);
                                    return (
                                        <label
                                            key={s._id}
                                            className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 text-sm transition-colors ${
                                                isChecked
                                                    ? 'border-[#5FD4A6] bg-[#5FD4A6]/10 font-medium text-slate-800'
                                                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleSintoma(s._id)}
                                                className="h-4 w-4 accent-[#5FD4A6]"
                                            />
                                            <span>{s.nombre}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Tratamiento Recomendado
                        </label>
                        <textarea
                            rows={3}
                            value={tratamiento}
                            onChange={(e) => setTratamiento(e.target.value)}
                            placeholder="Describa el tratamiento recomendado para esta afección..."
                            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-800 focus:border-[#2C5F7C] focus:ring-3 focus:ring-[#2C5F7C]/15 focus:outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                            <i className="fas fa-times" /> Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#5FD4A6] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4ab88c] disabled:opacity-60 cursor-pointer"
                        >
                            {saving ? (
                                <>
                                    <i className="fas fa-spinner fa-spin" /> Guardando...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save" /> Guardar Afección
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AfeccionFormularioPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFB]">
            <Navbar title="Formulario de Afección" />
            <main className="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
                <Suspense
                    fallback={
                        <div className="py-20 text-center">
                            <i className="fas fa-spinner fa-spin text-4xl text-[#2C5F7C]" />
                        </div>
                    }
                >
                    <AfeccionFormContent />
                </Suspense>
            </main>
        </div>
    );
}
