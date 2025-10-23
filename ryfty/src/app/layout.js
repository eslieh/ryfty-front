import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata = {
  title: "Ryfty - Discover Amazing Local Experiences",
  description: "Find and book unique local experiences, from cooking classes to adventure tours. Connect with passionate hosts and create unforgettable memories in your city.",
  keywords: "local experiences, activities, tours, cooking classes, adventure, travel, booking, hosts, authentic experiences",
  icons: {
    icon: [
      { url: '/dot.png', sizes: 'any' },
      { url: '/dot.png', sizes: '16x16', type: 'image/png' },
      { url: '/dot.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/dot.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/dot.png', color: '#00915a' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: "Ryfty - Discover Amazing Local Experiences",
    description: "Find and book unique local experiences, from cooking classes to adventure tours. Connect with passionate hosts and create unforgettable memories in your city.",
    type: 'website',
    siteName: 'Ryfty',
    images: [
      {
        url: '/iconss.png',
        width: 1200,
        height: 630,
        alt: 'Ryfty - Discover Amazing Local Experiences'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: "Ryfty - Discover Amazing Local Experiences",
    description: "Find and book unique local experiences, from cooking classes to adventure tours. Connect with passionate hosts and create unforgettable memories in your city.",
    images: ['/iconss.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  }
};
import { Figtree } from "next/font/google";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-figtree",
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={figtree.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
