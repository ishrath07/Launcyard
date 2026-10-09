export const THEMES = [
  {
    id: "harbor",
    name: "Harbor",
    description: "Navy and sand. A quiet, classic shop with serif headlines.",
    layout: "classic",
    swatches: ["#142033", "#1f4e79", "#efe6d6"],
  },
  {
    id: "bazaar",
    name: "Bazaar",
    description: "Saffron and ink. Dense market layout with loud prices.",
    layout: "market",
    swatches: ["#2a1408", "#e07a1f", "#fff1d6"],
  },
  {
    id: "atelier",
    name: "Atelier",
    description: "Black and white editorial. Large type, magazine rows.",
    layout: "editorial",
    swatches: ["#111111", "#f4f4f4", "#b08d57"],
  },
  {
    id: "grove",
    name: "Grove",
    description: "Forest and cream. Rounded cards and a soft lifestyle feel.",
    layout: "soft",
    swatches: ["#14352b", "#2f6b4f", "#e7f0e4"],
  },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export function getTheme(id: string) {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}
