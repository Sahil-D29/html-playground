import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import Provider from "@/components/Provider"
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
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <Provider>
          <Navbar />
          <main className="pt-14">{children}</main>
          <ToastContainer />
        </Provider>
      </body>
    </html>
  )
}
