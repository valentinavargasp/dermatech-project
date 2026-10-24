'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function LoginPage() {
    const { loginUser, showToast, user, loadingAuth } = useApp();
    const router = useRouter();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [shake, setShake] = useState(false);

    useEffect(() => {
        if (!loadingAuth && user) {
            router.replace('/dashboard');
        }
    }, [user, loadingAuth, router]);

    useEffect(() => {
        const remembered = localStorage.getItem('rememberedUser');
        if (remembered) {
            setUsername(remembered);
            setRemember(true);
        }
    }, []);

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedUser = username.trim();
        const trimmedPass = password.trim();

        if (!trimmedUser || !trimmedPass) {
            showToast('Por favor, complete todos los campos', 'error');
            triggerShake();
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: trimmedUser, password: trimmedPass }),
            });

            const data = await response.json();

            if (data.success && data.data) {
                showToast('¡Inicio de sesión exitoso!', 'success');
                loginUser(
                    {
                        id: data.data.id,
                        username: data.data.username,
                        role: data.data.role,
                        token: data.data.token,
                        loginTime: new Date().toISOString(),
                    },
                    remember
                );
                setTimeout(() => {
                    router.push('/dashboard');
                }, 600);
            } else {
                setLoading(false);
                showToast(data.message || 'Usuario o contraseña incorrectos', 'error');
                triggerShake();
            }
        } catch (error) {
            console.error('Error en login:', error);
            setLoading(false);
            showToast('Error al conectar con el servidor', 'error');
            triggerShake();
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#4A9EBF] to-[#2C5F7C] p-4">
            {/* Floating Background Shapes */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="animate-float-slow absolute top-[10%] -left-[100px] h-[300px] w-[300px] rounded-full bg-white/10" />
                <div
                    className="animate-float-slow absolute top-[60%] -right-[50px] h-[200px] w-[200px] rounded-full bg-white/10"
                    style={{ animationDelay: '5s' }}
                />
                <div
                    className="animate-float-slow absolute bottom-[10%] left-[50%] h-[150px] w-[150px] rounded-full bg-white/10"
                    style={{ animationDelay: '10s' }}
                />
            </div>

            <div className="relative z-10 w-full max-w-[450px]">
                {/* Login Card */}
                <div
                    className={`rounded-2xl bg-white p-8 sm:p-10 shadow-2xl transition-transform ${
                        shake ? 'animate-shake' : ''
                    }`}
                >
                    <div className="mb-8 text-center">
                        <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#2C5F7C] to-[#4A9EBF] shadow-lg">
                            <i className="fas fa-heartbeat text-3xl text-white" />
                            <i className="fas fa-hand-holding-medical absolute right-2.5 bottom-2.5 text-lg text-[#5FD4A6]" />
                        </div>
                        <h1 className="text-3xl font-bold text-[#2C5F7C]">DermaTech</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Diagnóstico dermatológico asistido por IA
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="username"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Usuario
                            </label>
                            <div className="relative flex items-center">
                                <i className="fas fa-user absolute left-4 text-slate-400" />
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Ingrese su usuario"
                                    autoComplete="username"
                                    required
                                    className="h-12 w-full rounded-lg border border-slate-200 bg-white pr-4 pl-11 text-base text-slate-800 transition-all focus:border-[#2C5F7C] focus:ring-3 focus:ring-[#2C5F7C]/15 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Contraseña
                            </label>
                            <div className="relative flex items-center">
                                <i className="fas fa-lock absolute left-4 text-slate-400" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Ingrese su contraseña"
                                    autoComplete="current-password"
                                    required
                                    className="h-12 w-full rounded-lg border border-slate-200 bg-white pr-11 pl-11 text-base text-slate-800 transition-all focus:border-[#2C5F7C] focus:ring-3 focus:ring-[#2C5F7C]/15 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 p-2 text-slate-400 hover:text-[#2C5F7C] cursor-pointer"
                                    tabIndex={-1}
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className="h-4 w-4 cursor-pointer accent-[#2C5F7C]"
                                />
                                <span>Recordarme</span>
                            </label>
                            <button
                                type="button"
                                onClick={() =>
                                    showToast(
                                        'Credenciales por defecto: usuario "alumno" / clave "alu123"',
                                        'info',
                                        4000
                                    )
                                }
                                className="font-medium text-[#2C5F7C] hover:underline cursor-pointer"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex h-13 w-full items-center justify-center gap-2 rounded-lg bg-[#2C5F7C] text-lg font-semibold text-white shadow-md transition-all hover:bg-[#1e4357] disabled:opacity-60 cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin" />
                                    <span>Ingresando...</span>
                                </>
                            ) : (
                                <span>Iniciar Sesión</span>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-sm text-white/90 space-y-1">
                    <p>&copy; 2026 DermaTech.</p>
                </div>
            </div>
        </div>
    );
}
