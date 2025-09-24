import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata = {
  title: "Ryfty - Endless experiences awaits you ✨",
  description: "Endless experiences awaits you ✨",
};
import { Figtree } from "next/font/google";
import Head from "next/head";
const figtree = Figtree({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-figtree",
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head>
        <title>Ryfty - Endless experiences awaits you ✨</title>
        <meta name="description" content="Experience your country like never before" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/main.png" />
      </Head>
      <body className={figtree.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
