'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface UserSession {
    id: string;
    username: string;
    role: 'alumno' | 'admin';
    token: string;
    loginTime?: string;
}

interface ToastState {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    visible: boolean;
}

interface AppContextType {
    user: UserSession | null;
    loadingAuth: boolean;
    loginUser: (userData: UserSession, remember?: boolean) => void;
    logout: () => void;
    showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
    fetchAPI: <T = unknown>(endpoint: string, options?: RequestInit) => Promise<T | null>;
    fetchAPIFormData: <T = unknown>(endpoint: string, formData: FormData, method?: string) => Promise<T | null>;
    getImageUrl: (imagePath?: string | null) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserSession | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [toast, setToast] = useState<ToastState>({
        message: '',
        type: 'info',
        visible: false,
    });

    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        try {
            const stored = sessionStorage.getItem('user');
            if (stored) {
                setUser(JSON.parse(stored));
            }
        } catch (err) {
            console.error('Error leyendo sesión:', err);
        } finally {
            setLoadingAuth(false);
        }
    }, []);

    useEffect(() => {
        if (!loadingAuth && !user && pathname !== '/login' && pathname !== '/') {
            router.replace('/login');
        }
    }, [loadingAuth, user, pathname, router]);

    const showToast = useCallback(
        (
            message: string,
            type: 'success' | 'error' | 'warning' | 'info' = 'info',
            duration = 3000
        ) => {
            setToast({ message, type, visible: true });
            setTimeout(() => {
                setToast((prev) => ({ ...prev, visible: false }));
            }, duration);
        },
        []
    );

    const loginUser = useCallback(
        (userData: UserSession, remember = false) => {
            sessionStorage.setItem('user', JSON.stringify(userData));
            if (remember) {
                localStorage.setItem('rememberedUser', userData.username);
            } else {
                localStorage.removeItem('rememberedUser');
            }
            setUser(userData);
        },
        []
    );

    const logout = useCallback(() => {
        sessionStorage.removeItem('user');
        setUser(null);
        showToast('Sesión cerrada exitosamente', 'success', 2000);
        router.push('/login');
    }, [router, showToast]);

    const fetchAPI = useCallback(
        async <T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T | null> => {
            let token = user?.token;
            if (!token && typeof window !== 'undefined') {
                const stored = sessionStorage.getItem('user');
                if (stored) {
                    token = JSON.parse(stored).token;
                }
            }

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...((options.headers as Record<string, string>) || {}),
            };

            try {
                const response = await fetch(`/api${endpoint}`, {
                    ...options,
                    headers,
                });

                if (response.status === 401) {
                    sessionStorage.removeItem('user');
                    setUser(null);
                    router.push('/login');
                    return null;
                }

                return (await response.json()) as T;
            } catch (error) {
                console.error('Error en petición API:', error);
                showToast('Error al conectar con el servidor', 'error');
                throw error;
            }
        },
        [user, router, showToast]
    );

    const fetchAPIFormData = useCallback(
        async <T = unknown>(
            endpoint: string,
            formData: FormData,
            method = 'POST'
        ): Promise<T | null> => {
            let token = user?.token;
            if (!token && typeof window !== 'undefined') {
                const stored = sessionStorage.getItem('user');
                if (stored) {
                    token = JSON.parse(stored).token;
                }
            }

            try {
                const response = await fetch(`/api${endpoint}`, {
                    method,
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: formData,
                });

                if (response.status === 401) {
                    sessionStorage.removeItem('user');
                    setUser(null);
                    router.push('/login');
                    return null;
                }

                return (await response.json()) as T;
            } catch (error) {
                console.error('Error en petición API FormData:', error);
                showToast('Error al conectar con el servidor', 'error');
                throw error;
            }
        },
        [user, router, showToast]
    );

    const getImageUrl = useCallback((imagePath?: string | null): string => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http') || imagePath.includes('cloudinary.com')) {
            return imagePath;
        }
        if (imagePath.startsWith('/')) {
            return imagePath;
        }
        return `/${imagePath}`;
    }, []);

    const toastIcons = {
        success: 'fa-check-circle text-[#5FD4A6]',
        error: 'fa-times-circle text-[#FF6B6B]',
        warning: 'fa-exclamation-triangle text-[#FF9F66]',
        info: 'fa-info-circle text-[#4A9EBF]',
    };

    const toastBorders = {
        success: 'border-l-4 border-[#5FD4A6]',
        error: 'border-l-4 border-[#FF6B6B]',
        warning: 'border-l-4 border-[#FF9F66]',
        info: 'border-l-4 border-[#4A9EBF]',
    };

    return (
        <AppContext.Provider
            value={{
                user,
                loadingAuth,
                loginUser,
                logout,
                showToast,
                fetchAPI,
                fetchAPIFormData,
                getImageUrl,
            }}
        >
            {children}

            {/* Global Toast Notification */}
            <div
                className={`fixed bottom-5 left-5 z-50 flex min-w-[300px] items-center gap-3 rounded-lg bg-white px-5 py-4 shadow-xl transition-all duration-300 ${
                    toastBorders[toast.type]
                } ${
                    toast.visible
                        ? 'translate-y-0 opacity-100 visible'
                        : 'translate-y-5 opacity-0 invisible pointer-events-none'
                }`}
            >
                <i className={`fas ${toastIcons[toast.type]} text-xl`} />
                <span className="text-sm font-medium text-slate-700">{toast.message}</span>
            </div>
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp debe usarse dentro de un AppProvider');
    }
    return context;
}
