import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "Nosso Futuro", short_name: "Nosso Futuro", description: "Vida financeira e sonhos a dois.", lang: "pt-BR", start_url: "/", display: "standalone", background_color: "#f7f8f3", theme_color: "#315740", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }] };
}
