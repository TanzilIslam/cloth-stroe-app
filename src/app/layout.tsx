import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Shop Dashboard",
  description: "Sales, stock and hisab for the shops",
  appleWebApp: { capable: true, title: "Shop", statusBarStyle: "default" },
}

export const viewport: Viewport = {
  themeColor: "#171717",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
