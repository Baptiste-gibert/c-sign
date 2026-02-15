import React, { createContext, useContext, useEffect, useMemo } from 'react'

import {
  BUILT_IN_THEMES,
  DEFAULT_THEME_ID,
  generateThemeWithMode,
  type ThemeDefinition,
  type ThemeMode,
} from '@/config/themes'

// ============================================================================
// Context
// ============================================================================

type ThemeContextValue = {
  theme: ThemeDefinition
  themeId: string
  mode: ThemeMode
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// ============================================================================
// Provider Component
// ============================================================================

type ThemeProviderProps = {
  children: React.ReactNode
  themeId?: string
  customAccent?: string
  mode?: ThemeMode
}

export function ThemeProvider({
  children,
  themeId,
  customAccent,
  mode = 'dark',
}: ThemeProviderProps) {
  // Resolve theme: built-in themeId > custom accent > default, then apply mode
  const theme = useMemo(() => {
    if (themeId && BUILT_IN_THEMES[themeId]) {
      const builtIn = BUILT_IN_THEMES[themeId]
      return generateThemeWithMode(builtIn.accentHex, builtIn.name, builtIn.id, builtIn.emoji, mode)
    }
    if (customAccent) {
      return generateThemeWithMode(customAccent, 'Custom', 'custom', '', mode)
    }
    const defaultTheme = BUILT_IN_THEMES[DEFAULT_THEME_ID]
    return generateThemeWithMode(
      defaultTheme.accentHex,
      defaultTheme.name,
      defaultTheme.id,
      defaultTheme.emoji,
      mode,
    )
  }, [themeId, customAccent, mode])

  const resolvedThemeId =
    themeId && BUILT_IN_THEMES[themeId] ? themeId : customAccent ? 'custom' : DEFAULT_THEME_ID

  // Convert CSS custom properties to React.CSSProperties
  const cssVars = {
    '--bg': theme.vars['--bg'],
    '--surface': theme.vars['--surface'],
    '--accent': theme.vars['--accent'],
    '--accent-hover': theme.vars['--accent-hover'],
    '--accent-fg': theme.vars['--accent-fg'],
    '--text': theme.vars['--text'],
    '--text-sec': theme.vars['--text-sec'],
    '--border-c': theme.vars['--border-c'],
    '--success': theme.vars['--success'],
    '--error': theme.vars['--error'],
    '--warning': theme.vars['--warning'],
  } as React.CSSProperties

  // Sync CSS vars to document root so portaled elements (Radix dropdowns, dialogs)
  // that render outside this div can still resolve var(--surface), var(--bg), etc.
  useEffect(() => {
    const root = document.documentElement
    for (const [key, value] of Object.entries(theme.vars)) {
      root.style.setProperty(key, value)
    }
  }, [theme.vars])

  return (
    <ThemeContext.Provider value={{ theme, themeId: resolvedThemeId, mode }}>
      <div
        className="min-h-screen"
        style={{
          ...cssVars,
          fontFamily: "'Inter', system-ui, sans-serif",
          backgroundColor: 'var(--bg)',
          color: 'var(--text)',
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
