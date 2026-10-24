'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

interface ImageModalProps {
    imagePath: string | null;
    title?: string;
    onClose: () => void;
}

export default function ImageModal({
    imagePath,
    title = 'Imagen de la Consulta',
    onClose,
}: ImageModalProps) {
    const { getImageUrl } = useApp();

    if (!imagePath) return null;

    const fullUrl = getImageUrl(imagePath);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
            onClick={onClose}
        >
            <div
                className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-4 rounded-xl bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-[#2C5F7C]">
                        <i className="fas fa-image" /> {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                    >
                        <i className="fas fa-times text-xl" />
                    </button>
                </div>

                <div className="flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={fullUrl}
                        alt={title}
                        className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-[#2C5F7C] px-5 py-2 text-sm font-medium text-white hover:bg-[#1e4357] transition-colors cursor-pointer"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
