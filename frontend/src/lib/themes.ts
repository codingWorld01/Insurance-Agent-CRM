export const themes = {
  light: {
    name: "Light",
    colors: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0 0)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.145 0 0)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.145 0 0)",
      primary: "oklch(0.396 0.115 252.417)",
      primaryForeground: "oklch(0.985 0 0)",
      secondary: "oklch(0.97 0 0)",
      secondaryForeground: "oklch(0.205 0 0)",
      muted: "oklch(0.97 0 0)",
      mutedForeground: "oklch(0.556 0 0)",
      accent: "oklch(0.97 0 0)",
      accentForeground: "oklch(0.205 0 0)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.922 0 0)",
      input: "oklch(0.922 0 0)",
      ring: "oklch(0.396 0.115 252.417)",
    }
  },
  dark: {
    name: "Dark",
    colors: {
      background: "oklch(0.09 0 0)",
      foreground: "oklch(0.985 0 0)",
      card: "oklch(0.145 0 0)",
      cardForeground: "oklch(0.985 0 0)",
      popover: "oklch(0.145 0 0)",
      popoverForeground: "oklch(0.985 0 0)",
      primary: "oklch(0.708 0.15 252.417)",
      primaryForeground: "oklch(0.09 0 0)",
      secondary: "oklch(0.205 0 0)",
      secondaryForeground: "oklch(0.985 0 0)",
      muted: "oklch(0.205 0 0)",
      mutedForeground: "oklch(0.708 0 0)",
      accent: "oklch(0.205 0 0)",
      accentForeground: "oklch(0.985 0 0)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(0.269 0 0)",
      input: "oklch(0.269 0 0)",
      ring: "oklch(0.708 0.15 252.417)",
    }
  }
} as const;

export type ThemeName = keyof typeof themes;

export const getThemeColors = (theme: ThemeName) => themes[theme].colors;