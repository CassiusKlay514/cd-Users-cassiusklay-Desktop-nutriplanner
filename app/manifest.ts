import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NutriPlanner",
    short_name: "NutriPlanner",
    description: "Votre assistant nutrition propulsé par l'IA. Plan de repas, courses, suivi.",
    lang: "fr-FR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafaf7",
    theme_color: "#16a34a",
    categories: ["food", "health", "lifestyle"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
    shortcuts: [
      {
        name: "Mon plan",
        short_name: "Plan",
        description: "Voir mon plan de la semaine",
        url: "/plan",
      },
      {
        name: "Liste de courses",
        short_name: "Courses",
        description: "Ma liste de courses",
        url: "/shopping",
      },
      {
        name: "Photo du frigo",
        short_name: "Frigo",
        description: "Générer un plan depuis une photo",
        url: "/fridge",
      },
    ],
  };
}
