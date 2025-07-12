import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ElectroQuiz - Electronics Engineering Learning Platform",
    short_name: "ElectroQuiz",
    description: "A comprehensive quiz and learning platform for Electronics Engineering (BE) students",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f59e0b",
    icons: [
      {
        src: "./speak.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "./speak.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
