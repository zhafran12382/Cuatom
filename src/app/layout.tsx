import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Chat",
  description: "Chat with AI models via custom OpenAI-compatible providers",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="h-screen overflow-hidden">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            className: "bg-card text-foreground border-border",
          }}
        />
      </body>
    </html>
  );
}
