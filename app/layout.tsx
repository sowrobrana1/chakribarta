import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "ChakriBarta — চাকরির খবর | Job Circular BD",
  description:
    "বাংলাদেশের সব সরকারি, ব্যাংক, NGO ও প্রাইভেট চাকরির সার্কুলার এক জায়গায় — নতুন সার্কুলার এলেই নোটিফিকেশন, ডেডলাইন countdown, সরাসরি Apply লিংক।",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ChakriBarta",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a5c3e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="phone-frame">
          {children}
          <footer className="app-footer">
            <p>
              দাবিত্যাগ: ChakriBarta কোনো সরকারি অ্যাপ নয়। আমরা শুধু অফিসিয়াল
              উৎস থেকে সংগৃহীত তথ্য প্রকাশ করি — আবেদনের আগে সংশ্লিষ্ট
              প্রতিষ্ঠানের মূল সার্কুলারটি যাচাই করে নিন।
            </p>
          </footer>
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
