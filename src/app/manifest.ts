// PWA manifest: lets staff add the app to their phone's home screen.
import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shop Dashboard",
    short_name: "Shop",
    description: "Sales, stock and hisab for the shops",
    start_url: "/login",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#172e5b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
