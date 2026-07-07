import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import Provider from "@/components/Provider"
import { ThemeProvider } from "@/components/ThemeProvider"
import Navbar from "@/components/Navbar"
import ToastContainer from "@/components/Toast"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "HTML Playground",
  description: "Write HTML, CSS, and JS in a live editor. Preview in real time. Share with anyone.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-gray-50 dark:bg-surface text-gray-900 dark:text-gray-100">
        <ThemeProvider>
          <Provider>
            <Navbar />
            <main className="pt-14">{children}</main>
            <ToastContainer />
          </Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}
