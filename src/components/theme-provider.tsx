"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { AnimatePresence, motion } from "framer-motion"

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

// Main provider component to be used in the layout
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

// This component wraps your content and handles the animation
export function ThemeTransition({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={resolvedTheme} // Keying by theme is what makes the transition work
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}