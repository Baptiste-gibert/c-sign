// Theme configuration and palette generation for C-Sign

// ============================================================================
// Type Definitions
// ============================================================================

export type ThemeMode = 'dark' | 'light'

export type ThemeVars = {
  '--bg': string
  '--surface': string
  '--accent': string
  '--accent-hover': string
  '--accent-fg': string
  '--text': string
  '--text-sec': string
  '--border-c': string
  '--success': string
  '--error': string
  '--warning': string
}

export type ThemeDefinition = {
  id: string
  name: string
  emoji: string
  accentHex: string
  headerBg: string
  mode: ThemeMode
  vars: ThemeVars
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert hex color to HSL components
 */
export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = parseInt(hex.slice(1, 3), 16) / 255
  let g = parseInt(hex.slice(3, 5), 16) / 255
  let b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

/**
 * Convert HSL components to hex color
 */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// ============================================================================
// WCAG Contrast Validation
// ============================================================================

/**
 * Calculate relative luminance of a hex color
 */
export function luminance(hex: string): number {
  const rgb = [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ].map((c) => {
    c /= 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
}

/**
 * Calculate contrast ratio between two hex colors
 */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1)
  const l2 = luminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Validate theme contrast ratios against WCAG AA standards
 */
export function validateThemeContrast(vars: ThemeVars): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  // Text (#fff) vs bg >= 4.5 (AA normal text)
  const textBgRatio = contrastRatio(vars['--text'], vars['--bg'])
  if (textBgRatio < 4.5) {
    issues.push(`Text/bg contrast ${textBgRatio.toFixed(2)} < 4.5 (AA)`)
  }

  // Text (#fff) vs surface >= 4.5
  const textSurfaceRatio = contrastRatio(vars['--text'], vars['--surface'])
  if (textSurfaceRatio < 4.5) {
    issues.push(`Text/surface contrast ${textSurfaceRatio.toFixed(2)} < 4.5 (AA)`)
  }

  // Accent vs bg >= 3.0 (AA large text / UI elements)
  const accentBgRatio = contrastRatio(vars['--accent'], vars['--bg'])
  if (accentBgRatio < 3.0) {
    issues.push(`Accent/bg contrast ${accentBgRatio.toFixed(2)} < 3.0 (AA UI)`)
  }

  // Text-sec vs surface >= 4.5
  const textSecSurfaceRatio = contrastRatio(vars['--text-sec'], vars['--surface'])
  if (textSecSurfaceRatio < 4.5) {
    issues.push(`Text-sec/surface contrast ${textSecSurfaceRatio.toFixed(2)} < 4.5 (AA)`)
  }

  // Accent-fg vs accent >= 4.5 (text on accent buttons)
  const accentFgRatio = contrastRatio(vars['--accent-fg'], vars['--accent'])
  if (accentFgRatio < 4.5) {
    issues.push(`Accent-fg/accent contrast ${accentFgRatio.toFixed(2)} < 4.5 (AA)`)
  }

  return { valid: issues.length === 0, issues }
}

// ============================================================================
// Theme Generation
// ============================================================================

/**
 * Generate a complete theme from a single accent hex color
 *
 * Implements the exact derivation formulas from design system section 7:
 * - --accent = input hex
 * - --accent-hover = hsl(H, S, max(L-8, 20))
 * - --bg = hsl(H, clamp(S*0.35, 20, 45), 6)
 * - --surface = hsl(H, clamp(S*0.40, 20, 50), 14)
 * - --text = #ffffff (invariant)
 * - --text-sec = hsl(H, clamp(S*0.50, 25, 60), 80)
 * - --border-c = hsl(H, clamp(S*0.35, 15, 40), 24)
 * - --success = #10b981, --error = #ef4444, --warning = #f59e0b (invariants)
 */
export function generateTheme(
  accentHex: string,
  name: string,
  id: string,
  emoji: string,
): ThemeDefinition {
  const { h, s, l } = hexToHSL(accentHex)

  // Derive colors per algorithm
  const accent = accentHex
  const accentHover = hslToHex(h, s, Math.max(l - 8, 20))
  const bg = hslToHex(h, clamp(s * 0.35, 20, 45), 6)
  const surface = hslToHex(h, clamp(s * 0.4, 20, 50), 14)
  const textSec = hslToHex(h, clamp(s * 0.5, 25, 60), 80)
  const borderC = hslToHex(h, clamp(s * 0.35, 15, 40), 24)

  // Generate header gradient background
  const hComplement = (h + 30) % 360
  const haloComplement = hslToHex(hComplement, s * 0.3, l * 0.3)
  const midGradient = hslToHex(h, s * 0.5, 12)

  const headerBg = `
    radial-gradient(ellipse 75% 55% at 35% 45%, ${accent}20, transparent 55%),
    radial-gradient(ellipse 55% 50% at 70% 30%, ${haloComplement}18, transparent 50%),
    linear-gradient(145deg, ${bg}, ${midGradient}, ${bg})
  `
    .trim()
    .replace(/\s+/g, ' ')

  // Compute foreground color for text ON accent backgrounds
  const accentFg = luminance(accent) > 0.4 ? bg : '#ffffff'

  return {
    id,
    name,
    emoji,
    accentHex: accent,
    headerBg,
    mode: 'dark' as ThemeMode,
    vars: {
      '--bg': bg,
      '--surface': surface,
      '--accent': accent,
      '--accent-hover': accentHover,
      '--accent-fg': accentFg,
      '--text': '#ffffff',
      '--text-sec': textSec,
      '--border-c': borderC,
      '--success': '#10b981',
      '--error': '#ef4444',
      '--warning': '#f59e0b',
    },
  }
}

/**
 * Generate a light theme from a single accent hex color
 *
 * Light palette derivation:
 * - --bg = near-white with hue tint
 * - --surface = pure white
 * - --text = near-black with hue tint
 * - --text-sec = medium gray with hue tint
 * - --border-c = light gray
 * - --accent = same hex
 */
export function generateLightTheme(
  accentHex: string,
  name: string,
  id: string,
  emoji: string,
): ThemeDefinition {
  const { h, s, l } = hexToHSL(accentHex)

  const accent = accentHex
  const accentHover = hslToHex(h, s, Math.min(l + 8, 80))
  const bg = hslToHex(h, clamp(s * 0.08, 3, 12), 97)
  const surface = '#ffffff'
  const text = hslToHex(h, clamp(s * 0.25, 10, 30), 15)
  const textSec = hslToHex(h, clamp(s * 0.15, 8, 25), 45)
  const borderC = hslToHex(h, clamp(s * 0.1, 5, 20), 85)

  // Compute foreground color for text ON accent backgrounds
  const accentFg = luminance(accent) > 0.4 ? text : '#ffffff'

  // Generate header gradient background (subtle light version)
  const hComplement = (h + 30) % 360
  const haloComplement = hslToHex(hComplement, s * 0.15, 90)
  const midGradient = hslToHex(h, s * 0.1, 95)

  const headerBg = `
    radial-gradient(ellipse 75% 55% at 35% 45%, ${accent}12, transparent 55%),
    radial-gradient(ellipse 55% 50% at 70% 30%, ${haloComplement}10, transparent 50%),
    linear-gradient(145deg, ${bg}, ${midGradient}, ${bg})
  `
    .trim()
    .replace(/\s+/g, ' ')

  return {
    id,
    name,
    emoji,
    accentHex: accent,
    headerBg,
    mode: 'light',
    vars: {
      '--bg': bg,
      '--surface': surface,
      '--accent': accent,
      '--accent-hover': accentHover,
      '--accent-fg': accentFg,
      '--text': text,
      '--text-sec': textSec,
      '--border-c': borderC,
      '--success': '#059669',
      '--error': '#dc2626',
      '--warning': '#d97706',
    },
  }
}

/**
 * Generate a theme with the specified mode (dark or light)
 */
export function generateThemeWithMode(
  accentHex: string,
  name: string,
  id: string,
  emoji: string,
  mode: ThemeMode = 'dark',
): ThemeDefinition {
  if (mode === 'light') {
    return generateLightTheme(accentHex, name, id, emoji)
  }
  return generateTheme(accentHex, name, id, emoji)
}

// ============================================================================
// Built-in Palettes
// ============================================================================

const techModern = generateTheme('#00d9ff', 'Tech Modern', 'tech-modern', '')
const vibrantPurple = generateTheme('#c084fc', 'Vibrant Purple', 'vibrant-purple', '')
const natureTeal = generateTheme('#14b8a6', 'Nature Teal', 'nature-teal', '')
const energyOrange = generateTheme('#f97316', 'Energy Orange', 'energy-orange', '')

export const BUILT_IN_THEMES: Record<string, ThemeDefinition> = {
  'tech-modern': techModern,
  'vibrant-purple': vibrantPurple,
  'nature-teal': natureTeal,
  'energy-orange': energyOrange,
}

export const DEFAULT_THEME_ID = 'tech-modern'
