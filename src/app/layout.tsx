import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

export const metadata: Metadata = {
    title: 'DermaTech - Diagnóstico Dermatológico Asistido por IA',
    description: 'Sistema integral de gestión y diagnóstico dermatológico con Inteligencia Artificial',
    icons: {
        icon: '/uploads/heartbeat.svg',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <head>
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap"
                />
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
                />
            </head>
            <body className="antialiased">
                <AppProvider>{children}</AppProvider>
            </body>
        </html>
    );
}
