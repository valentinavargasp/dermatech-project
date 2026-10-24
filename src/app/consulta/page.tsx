'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useApp } from '@/context/AppContext';

interface SintomaItem {
    _id: string;
    nombre: string;
    descripcion?: string;
    zona?: string;
}

export default function ConsultaPage() {
    const { user, fetchAPI, fetchAPIFormData, showToast } = useApp();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [nombrePaciente, setNombrePaciente] = useState('');
    const [zonaAfectada, setZonaAfectada] = useState('');
    const [imagenFile, setImagenFile] = useState<File | null>(null);
    const [imagenPreview, setImagenPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const [sintomasList, setSintomasList] = useState<SintomaItem[]>([]);
    const [selectedSintomas, setSelectedSintomas] = useState<string[]>([]);
    const [searchSintomas, setSearchSintomas] = useState('');
    const [loadingSintomas, setLoadingSintomas] = useState(true);

    const [validationError, setValidationError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const cargarSintomas = useCallback(async () => {
        try {
            setLoadingSintomas(true);
            const res = await fetchAPI<{ success: boolean; data: SintomaItem[] }>('/sintomas');
            if (res && res.success) {
                setSintomasList(res.data || []);
            }
        } catch (error) {
            console.error('Error cargando síntomas:', error);
        } finally {
            setLoadingSintomas(false);
        }
    }, [fetchAPI]);

    useEffect(() => {
        if (user) {
            cargarSintomas();
        }
    }, [user, cargarSintomas]);

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            showToast('Por favor selecciona una imagen válida', 'error');
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

    const removeImage = () => {
        setImagenFile(null);
        setImagenPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const toggleSintoma = (id: string) => {
        setSelectedSintomas((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleNextStep = () => {
        setValidationError('');
        if (step === 1) {
            if (!nombrePaciente.trim()) {
                setValidationError('Por favor ingrese el nombre del paciente');
                return;
            }
            if (!zonaAfectada) {
                setValidationError('Por favor seleccione la zona afectada');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (selectedSintomas.length === 0) {
                setValidationError('Por favor seleccione al menos un síntoma');
                return;
            }
            setStep(3);
        }
    };

    const handlePrevStep = () => {
        setValidationError('');
        setStep((prev) => Math.max(1, prev - 1));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombrePaciente.trim() || !zonaAfectada || selectedSintomas.length === 0) {
            showToast('Por favor complete todos los datos requeridos', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('nombrePaciente', nombrePaciente.trim());
            formData.append('zonaAfectada', zonaAfectada);
            formData.append('sintomasReportados', JSON.stringify(selectedSintomas));
            if (imagenFile) {
                formData.append('imagenZona', imagenFile);
            }

            const res = await fetchAPIFormData<{
                success: boolean;
                data?: { _id: string };
                message?: string;
            }>('/consultas', formData);

            if (res && res.success && res.data) {
                showToast('Diagnóstico completado exitosamente', 'success');
                setTimeout(() => {
                    router.push(`/resultado?id=${res.data!._id}`);
                }, 800);
            } else {
                showToast(res?.message || 'Error al procesar la consulta', 'error');
                setSubmitting(false);
            }
        } catch (error) {
            console.error('Error finalizando consulta:', error);
            setSubmitting(false);
        }
    };

    const filteredSintomas = sintomasList.filter((s) =>
        s.nombre.toLowerCase().includes(searchSintomas.toLowerCase())
    );

    const selectedSintomasObjects = sintomasList.filter((s) =>
        selectedSintomas.includes(s._id)
    );

    return (
        <div className="min-h-screen bg-[#F8FAFB]">
            <Navbar title="Nueva Consulta" />

            <main className="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
                {/* Stepper */}
                <div className="mb-8 flex items-center justify-between rounded-xl bg-white p-6 shadow-sm">
                    {[
                        { num: 1, label: 'Datos del Paciente', icon: 'fa-user' },
                        { num: 2, label: 'Síntomas', icon: 'fa-clipboard-list' },
                        { num: 3, label: 'Confirmación', icon: 'fa-check-circle' },
                    ].map((item, idx) => {
                        const isActive = step === item.num;
                        const isCompleted = step > item.num;
                        return (
                            <React.Fragment key={item.num}>
                                <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
                                    <div
                                        className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold transition-colors ${
                                            isActive
                                                ? 'bg-[#2C5F7C] text-white shadow-md'
                                                : isCompleted
                                                  ? 'bg-[#5FD4A6] text-white'
                                                  : 'bg-slate-100 text-slate-400'
                                        }`}
                                    >
                                        <i
                                            className={`fas ${
                                                isCompleted ? 'fa-check' : item.icon
                                            }`}
                                        />
                                    </div>
                                    <span
                                        className={`text-xs sm:text-sm font-semibold ${
                                            isActive
                                                ? 'text-[#2C5F7C]'
                                                : isCompleted
                                                  ? 'text-[#2d8a68]'
                                                  : 'text-slate-400'
                                        }`}
                                    >
                                        {item.label}
                                    </span>
                                </div>
                                {idx < 2 && (
                                    <div
                                        className={`hidden sm:block h-1 flex-1 mx-4 rounded-full ${
                                            step > item.num ? 'bg-[#5FD4A6]' : 'bg-slate-200'
                                        }`}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Wizard Card */}
                <form
                    onSubmit={handleSubmit}
                    className="rounded-xl bg-white p-6 sm:p-8 shadow-sm"
                >
                    {/* Step 1: Patient Info */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold text-[#2C5F7C]">
                                Datos del Paciente Virtual
                            </h3>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Nombre del Paciente <span className="text-[#FF6B6B]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={nombrePaciente}
                                    onChange={(e) => setNombrePaciente(e.target.value)}
                                    placeholder="Ej: Paciente Virtual #1234"
                                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-800 focus:border-[#2C5F7C] focus:ring-3 focus:ring-[#2C5F7C]/15 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Zona Afectada <span className="text-[#FF6B6B]">*</span>
                                </label>
                                <select
                                    value={zonaAfectada}
                                    onChange={(e) => setZonaAfectada(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-800 focus:border-[#2C5F7C] focus:ring-3 focus:ring-[#2C5F7C]/15 focus:outline-none"
                                >
                                    <option value="">Seleccione una zona</option>
                                    <option value="rostro">Rostro</option>
                                    <option value="cuello">Cuello</option>
                                    <option value="torax">Tórax</option>
                                    <option value="abdomen">Abdomen</option>
                                    <option value="espalda">Espalda</option>
                                    <option value="brazos">Brazos</option>
                                    <option value="piernas">Piernas</option>
                                    <option value="manos">Manos</option>
                                    <option value="pies">Pies</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Imagen de la Zona Afectada{' '}
                                    <span className="text-xs font-normal text-slate-400">
                                        (Opcional - para análisis visual con IA Gemini)
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
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setIsDragging(true);
                                        }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsDragging(false);
                                            const file = e.dataTransfer.files?.[0];
                                            if (file) handleFileSelect(file);
                                        }}
                                        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                                            isDragging
                                                ? 'border-[#2C5F7C] bg-[#2C5F7C]/5'
                                                : 'border-slate-300 hover:border-[#2C5F7C] hover:bg-slate-50'
                                        }`}
                                    >
                                        <i className="fas fa-cloud-upload-alt mb-3 text-4xl text-[#4A9EBF]" />
                                        <p className="mb-3 text-sm font-medium text-slate-600">
                                            Arrastra una imagen aquí o haz clic para seleccionar
                                        </p>
                                        <button
                                            type="button"
                                            className="rounded-lg bg-[#2C5F7C] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e4357] cursor-pointer"
                                        >
                                            <i className="fas fa-folder-open mr-1.5" /> Seleccionar
                                            Imagen
                                        </button>
                                        <p className="mt-2 text-xs text-slate-400">
                                            PNG, JPG, WEBP hasta 5MB
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 rounded-xl border border-slate-200 p-4 text-center">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={imagenPreview}
                                            alt="Vista previa"
                                            className="mx-auto max-h-64 rounded-lg object-contain"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF6B6B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#e05555] cursor-pointer"
                                        >
                                            <i className="fas fa-times" /> Quitar imagen
                                        </button>
                                    </div>
                                )}
                            </div>

                            {validationError && (
                                <div className="flex items-center gap-3 rounded-lg border-l-4 border-[#FF6B6B] bg-[#FF6B6B]/10 px-4 py-3 text-sm font-medium text-[#cc3636]">
                                    <i className="fas fa-exclamation-circle text-lg" />
                                    <span>{validationError}</span>
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#5FD4A6] px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-[#4ab88c] cursor-pointer"
                                >
                                    Siguiente <i className="fas fa-arrow-right" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Symptoms */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                <h3 className="text-xl font-semibold text-[#2C5F7C]">
                                    Seleccione los Síntomas Presentes
                                </h3>
                                <span className="text-sm font-medium text-slate-500">
                                    Seleccionados: {selectedSintomas.length}
                                </span>
                            </div>

                            <div className="relative">
                                <i className="fas fa-search absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchSintomas}
                                    onChange={(e) => setSearchSintomas(e.target.value)}
                                    placeholder="Buscar síntomas..."
                                    className="w-full rounded-lg border border-slate-200 py-3 pr-4 pl-11 text-slate-800 focus:border-[#2C5F7C] focus:ring-3 focus:ring-[#2C5F7C]/15 focus:outline-none"
                                />
                            </div>

                            {loadingSintomas ? (
                                <div className="py-12 text-center">
                                    <i className="fas fa-spinner fa-spin text-3xl text-[#2C5F7C]" />
                                    <p className="mt-2 text-sm text-slate-400">
                                        Cargando síntomas...
                                    </p>
                                </div>
                            ) : filteredSintomas.length === 0 ? (
                                <p className="py-8 text-center text-slate-400">
                                    No se encontraron síntomas que coincidan con la búsqueda.
                                </p>
                            ) : (
                                <div className="grid max-h-[420px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 md:grid-cols-3">
                                    {filteredSintomas.map((sintoma) => {
                                        const checked = selectedSintomas.includes(sintoma._id);
                                        return (
                                            <label
                                                key={sintoma._id}
                                                onClick={() => toggleSintoma(sintoma._id)}
                                                className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-3.5 transition-all ${
                                                    checked
                                                        ? 'border-[#5FD4A6] bg-[#5FD4A6]/10 shadow-xs'
                                                        : 'border-slate-200 bg-white hover:border-[#2C5F7C]/40'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-5 w-5 items-center justify-center rounded border ${
                                                            checked
                                                                ? 'border-[#5FD4A6] bg-[#5FD4A6] text-white'
                                                                : 'border-slate-300 bg-white'
                                                        }`}
                                                    >
                                                        {checked && (
                                                            <i className="fas fa-check text-xs" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="block text-sm font-medium text-slate-800">
                                                            {sintoma.nombre}
                                                        </span>
                                                        {sintoma.zona && (
                                                            <span className="text-[11px] font-medium uppercase text-slate-400">
                                                                {sintoma.zona}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {validationError && (
                                <div className="flex items-center gap-3 rounded-lg border-l-4 border-[#FF6B6B] bg-[#FF6B6B]/10 px-4 py-3 text-sm font-medium text-[#cc3636]">
                                    <i className="fas fa-exclamation-circle text-lg" />
                                    <span>{validationError}</span>
                                </div>
                            )}

                            <div className="flex justify-between pt-4">
                                <button
                                    type="button"
                                    onClick={handlePrevStep}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                    <i className="fas fa-arrow-left" /> Anterior
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#5FD4A6] px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-[#4ab88c] cursor-pointer"
                                >
                                    Siguiente <i className="fas fa-arrow-right" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Confirmation */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold text-[#2C5F7C]">
                                Confirme los Datos de la Consulta
                            </h3>

                            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-2">
                                <h5 className="flex items-center gap-2 text-base font-semibold text-[#2C5F7C]">
                                    <i className="fas fa-user" /> Datos del Paciente
                                </h5>
                                <p className="text-sm text-slate-700">
                                    <strong>Nombre:</strong> {nombrePaciente}
                                </p>
                                <p className="text-sm text-slate-700 capitalize">
                                    <strong>Zona afectada:</strong> {zonaAfectada}
                                </p>
                                <p className="text-sm text-slate-700">
                                    <strong>Imagen adjunta:</strong>{' '}
                                    {imagenFile ? imagenFile.name : 'No se adjuntó imagen'}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-3">
                                <h5 className="flex items-center gap-2 text-base font-semibold text-[#2C5F7C]">
                                    <i className="fas fa-clipboard-list" /> Síntomas Seleccionados (
                                    {selectedSintomasObjects.length})
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                    {selectedSintomasObjects.map((s) => (
                                        <span
                                            key={s._id}
                                            className="inline-flex items-center gap-1.5 rounded-full bg-[#2C5F7C]/15 px-3.5 py-1.5 text-xs font-semibold text-[#2C5F7C]"
                                        >
                                            <i className="fas fa-check text-[#5FD4A6]" />
                                            {s.nombre}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={handlePrevStep}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                                >
                                    <i className="fas fa-arrow-left" /> Anterior
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#5FD4A6] px-7 py-3 text-base font-semibold text-white shadow-md transition-all hover:bg-[#4ab88c] disabled:opacity-60 cursor-pointer"
                                >
                                    {submitting ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin" /> Procesando con
                                            IA...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-stethoscope" /> Realizar
                                            Diagnóstico
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </main>
        </div>
    );
}
