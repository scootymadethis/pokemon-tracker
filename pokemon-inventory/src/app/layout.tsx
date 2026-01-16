// src/app/layout.tsx
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-zinc-950 text-zinc-100"
      >
        {children}
      </body>
    </html>
  );
}
