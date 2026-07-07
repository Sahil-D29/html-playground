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

const siteUrl = "https://html-playground.dev"

export const metadata: Metadata = {
  title: {
    default: "HTML Playground — Live HTML, CSS & JS Editor with Real-Time Preview",
    template: "%s | HTML Playground",
  },
  description:
    "Write HTML, CSS, and JavaScript in a live browser-based editor. See instant previews, save snippets, share with anyone. No setup required — start coding in seconds.",
  keywords: [
    "HTML editor",
    "online code editor",
    "live HTML preview",
    "CSS editor online",
    "JavaScript playground",
    "code playground",
    "web development tool",
    "HTML playground",
    "share code online",
    "free code editor",
    "browser code editor",
    "real-time preview",
  ],
  authors: [{ name: "HTML Playground" }],
  creator: "HTML Playground",
  publisher: "HTML Playground",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "HTML Playground",
    title: "HTML Playground — Live HTML, CSS & JS Editor",
    description:
      "Write HTML, CSS, and JavaScript in a live browser-based editor. See instant previews, save snippets, share with anyone.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "HTML Playground — Live Code Editor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HTML Playground — Live HTML, CSS & JS Editor",
    description:
      "Write HTML, CSS, and JavaScript in a live browser-based editor. See instant previews, save snippets, share with anyone.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "HTML Playground",
  url: siteUrl,
  description:
    "Free online HTML, CSS, and JavaScript editor with live preview. Write code, see results instantly, save and share snippets.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Live HTML, CSS, and JavaScript editing",
    "Real-time browser preview",
    "Code snippets with shareable links",
    "Dark and light mode themes",
    "Mobile responsive editor",
    "Save and organize projects",
    "Download as HTML or image",
  ],
  screenshot: `${siteUrl}/og.png`,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
