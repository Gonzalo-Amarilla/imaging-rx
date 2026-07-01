import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Imaging Rx — Tecnología que se explica sola",
  description:
    "Experiencia inmersiva de un equipo de imagen médica que se desarma ante tus ojos a medida que descubrís cómo funciona.",
  applicationName: "Imaging Rx",
  authors: [{ name: "Imaging Rx S.A.S." }],
  openGraph: {
    title: "Imaging Rx — Tecnología que se explica sola",
    description:
      "Hacé scroll y observá cómo nuestro sistema de imagen se desarma, pieza por pieza, para revelar la ingeniería detrás de cada diagnóstico.",
    type: "website",
    locale: "es_AR",
    siteName: "Imaging Rx",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c1b33",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700;1,800&display=swap"
          rel="stylesheet"
        />
        {/* Start downloading the 3D model immediately, in parallel with the JS,
            so it's already cached by the time the WebGL scene mounts. */}
        <link
          rel="preload"
          href="/models/ct_scanner.glb"
          as="fetch"
          crossOrigin="anonymous"
        />
        {/* Warm up the connection to the Draco decoder CDN (gstatic). */}
        <link rel="preconnect" href="https://www.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
