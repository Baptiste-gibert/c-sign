import React, { createContext, useContext, useMemo } from 'react'
import { generateTheme, BUILT_IN_THEMES, DEFAULT_THEME_ID, type ThemeDefinition } from '@/config/themes'

// ============================================================================
// Context
// ============================================================================

type ThemeContextValue = {
  theme: ThemeDefinition
  themeId: string
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// ============================================================================
// Provider Component
// ============================================================================

type ThemeProviderProps = {
  children: React.ReactNode
  themeId?: string
  customAccent?: string
}

export function ThemeProvider({ children, themeId, customAccent }: ThemeProviderProps) {
  // Resolve theme: built-in themeId > custom accent > default
  const theme = useMemo(() => {
    if (themeId && BUILT_IN_THEMES[themeId]) {
      return BUILT_IN_THEMES[themeId]
    }
    if (customAccent) {
      return generateTheme(customAccent, 'Custom', 'custom', '')
    }
    return BUILT_IN_THEMES[DEFAULT_THEME_ID]
  }, [themeId, customAccent])

  const resolvedThemeId = themeId && BUILT_IN_THEMES[themeId] ? themeId : customAccent ? 'custom' : DEFAULT_THEME_ID

  // Convert CSS custom properties to React.CSSProperties
  const cssVars = {
    '--bg': theme.vars['--bg'],
    '--surface': theme.vars['--surface'],
    '--accent': theme.vars['--accent'],
    '--accent-hover': theme.vars['--accent-hover'],
    '--text': theme.vars['--text'],
    '--text-sec': theme.vars['--text-sec'],
    '--border-c': theme.vars['--border-c'],
    '--success': theme.vars['--success'],
    '--error': theme.vars['--error'],
    '--warning': theme.vars['--warning'],
  } as React.CSSProperties

  return (
    <ThemeContext.Provider value={{ theme, themeId: resolvedThemeId }}>
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
