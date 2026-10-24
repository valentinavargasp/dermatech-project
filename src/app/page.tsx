'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function HomePage() {
    const { user, loadingAuth } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (!loadingAuth) {
            if (user) {
                router.replace('/dashboard');
            } else {
                router.replace('/login');
            }
        }
    }, [user, loadingAuth, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#4A9EBF] to-[#2C5F7C]">
            <div className="flex flex-col items-center gap-4 text-white">
                <i className="fas fa-spinner fa-spin text-4xl" />
                <p className="text-lg font-medium">Cargando DermaTech...</p>
            </div>
        </div>
    );
}
