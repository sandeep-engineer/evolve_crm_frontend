"use client";

import type { ReactNode } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: { main: "#2558d9", dark: "#173ea5", light: "#eaf0ff" },
    secondary: { main: "#a66322" },
    success: { main: "#087a55" },
    warning: { main: "#b56816" },
    error: { main: "#c53c45" },
    background: { default: "#f5f7fa", paper: "#ffffff" },
    text: { primary: "#172033", secondary: "#5d687a" },
    divider: "#e2e6ed",
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "var(--font-sans)",
    h4: { fontSize: "1.65rem", fontWeight: 750 },
    h5: { fontSize: "1.25rem", fontWeight: 750 },
    h6: { fontSize: "1rem", fontWeight: 700 },
    button: { fontWeight: 700, textTransform: "none" },
  },
  components: {
    MuiButton: { styleOverrides: { root: { minHeight: 40, boxShadow: "none" } } },
    MuiOutlinedInput: { styleOverrides: { root: { backgroundColor: "#fff" } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundImage: "none" } } },
  },
});

export function MyleadThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
