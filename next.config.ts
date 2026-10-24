import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongoose", "cloudinary", "bcryptjs", "jsonwebtoken"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/login.html", destination: "/login", permanent: true },
      { source: "/dashboard.html", destination: "/dashboard", permanent: true },
      { source: "/consulta.html", destination: "/consulta", permanent: true },
      { source: "/resultado.html", destination: "/resultado", permanent: true },
      { source: "/afecciones.html", destination: "/afecciones", permanent: true },
      { source: "/afeccion-form.html", destination: "/afecciones/formulario", permanent: true },
      { source: "/sintomas.html", destination: "/sintomas", permanent: true },
    ];
  },
};

export default nextConfig;
