'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';

interface NavbarProps {
    title?: string;
}

export default function Navbar({ title }: NavbarProps) {
    const { user, logout } = useApp();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    return (
        <>
            <nav className="sticky top-0 z-40 h-[70px] w-full bg-white shadow-sm">
                <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-6">
                    {/* Left: Brand Logo */}
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 text-xl font-bold text-[#2C5F7C] hover:opacity-90 transition-opacity"
                    >
                        <i className="fas fa-heartbeat text-2xl text-[#5FD4A6]" />
                        <span>DermaTech</span>
                    </Link>

                    {/* Center: Title or Navigation Links */}
                    <div className="hidden md:flex items-center gap-6">
                        {title ? (
                            <h1 className="text-lg font-medium text-slate-500">{title}</h1>
                        ) : (
                            <div className="flex items-center gap-5 text-sm font-medium text-slate-600">
                                <Link href="/dashboard" className="hover:text-[#2C5F7C] transition-colors">
                                    Dashboard
                                </Link>
                                <Link href="/consulta" className="hover:text-[#2C5F7C] transition-colors">
                                    Nueva Consulta
                                </Link>
                                <Link href="/afecciones" className="hover:text-[#2C5F7C] transition-colors">
                                    Afecciones
                                </Link>
                                <Link href="/sintomas" className="hover:text-[#2C5F7C] transition-colors">
                                    Síntomas
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Right: User Menu */}
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#2C5F7C] to-[#4A9EBF] text-white shadow-sm">
                            <i className="fas fa-user-md text-lg" />
                        </div>
                        <div className="hidden sm:flex flex-col">
                            <span className="text-sm font-semibold text-slate-800 capitalize">
                                {user?.username || 'Alumno'}
                            </span>
                            <span className="text-xs text-slate-500 capitalize">
                                {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowLogoutConfirm(true)}
                            title="Cerrar sesión"
                            className="ml-1 rounded-lg p-2.5 text-slate-500 transition-all hover:bg-red-50 hover:text-[#FF6B6B] cursor-pointer"
                        >
                            <i className="fas fa-sign-out-alt text-lg" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden rounded-lg p-2 text-[#2C5F7C]"
                            aria-label="Menú"
                        >
                            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`} />
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 shadow-lg">
                        <div className="flex flex-col gap-3 text-sm font-medium text-slate-700">
                            <Link
                                href="/dashboard"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-2 py-1.5 hover:text-[#2C5F7C]"
                            >
                                <i className="fas fa-home w-5 text-[#2C5F7C]" /> Dashboard
                            </Link>
                            <Link
                                href="/consulta"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-2 py-1.5 hover:text-[#2C5F7C]"
                            >
                                <i className="fas fa-stethoscope w-5 text-[#5FD4A6]" /> Nueva Consulta
                            </Link>
                            <Link
                                href="/afecciones"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-2 py-1.5 hover:text-[#2C5F7C]"
                            >
                                <i className="fas fa-notes-medical w-5 text-[#2C5F7C]" /> Gestionar Afecciones
                            </Link>
                            <Link
                                href="/sintomas"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-2 py-1.5 hover:text-[#2C5F7C]"
                            >
                                <i className="fas fa-list-check w-5 text-[#4A9EBF]" /> Gestionar Síntomas
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Modal Confirmación Logout */}
            {showLogoutConfirm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
                    onClick={() => setShowLogoutConfirm(false)}
                >
                    <div
                        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                <i className="fas fa-sign-out-alt text-[#2C5F7C]" />
                                Cerrar Sesión
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowLogoutConfirm(false)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <i className="fas fa-times text-lg" />
                            </button>
                        </div>
                        <p className="my-5 text-slate-600">
                            ¿Está seguro que desea cerrar su sesión actual en DermaTech?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowLogoutConfirm(false)}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowLogoutConfirm(false);
                                    logout();
                                }}
                                className="rounded-lg bg-[#FF6B6B] px-4 py-2 text-sm font-medium text-white hover:bg-[#e55a5a] cursor-pointer"
                            >
                                <i className="fas fa-sign-out-alt mr-1.5" /> Salir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
