import type { ReactNode } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { MyleadThemeProvider } from "@/features/mylead/mylead-theme";

export default function MyleadLayout({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <MyleadThemeProvider>{children}</MyleadThemeProvider>
    </AppRouterCacheProvider>
  );
}
