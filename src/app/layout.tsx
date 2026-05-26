import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Whale Doom: Operação Ressurgência",
  description: "Um jogo de navegação 3D cyberpunk no navegador utilizando Next.js, React Three Fiber e TailwindCSS.",
  keywords: ["Next.js", "Three.js", "React Three Fiber", "3D Game", "TailwindCSS", "WebGL"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full w-full select-none bg-black overflow-hidden">
      <body className="h-full w-full antialiased bg-gray-950 text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
