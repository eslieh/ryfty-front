import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata = {
  title: "Ryfty - Endless experiences awaits you ✨",
  description: "Endless experiences awaits you ✨",
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
  manifest: '/dot.png',
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
