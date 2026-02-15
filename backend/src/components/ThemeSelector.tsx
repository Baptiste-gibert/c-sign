import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'
import {
  BUILT_IN_THEMES,
  generateThemeWithMode,
  validateThemeContrast,
  type ThemeMode,
} from '@/config/themes'

interface ThemeValue {
  themeId?: string
  customAccent?: string
  mode?: ThemeMode
}

interface ThemeSelectorProps {
  value: ThemeValue | null
  onChange: (theme: ThemeValue) => void
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const { t } = useTranslation('organizer')
  const [customHex, setCustomHex] = useState(value?.customAccent || '#00d9ff')
  const [showContrastWarning, setShowContrastWarning] = useState(false)

  const currentMode: ThemeMode = value?.mode || 'dark'

  // Sync custom hex when value changes externally
  useEffect(() => {
    if (value?.customAccent) {
      setCustomHex(value.customAccent)
    }
  }, [value?.customAccent])

  const handleModeChange = (mode: ThemeMode) => {
    onChange({ ...value, mode })
  }

  const handleThemeClick = (themeId: string) => {
    onChange({ themeId, mode: currentMode })
  }

  const handleCustomChange = (hex: string) => {
    setCustomHex(hex)

    // Validate hex format
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      onChange({ customAccent: hex, mode: currentMode })

      // Check contrast
      const generatedTheme = generateThemeWithMode(hex, 'Custom', 'custom', '', currentMode)
      const validation = validateThemeContrast(generatedTheme.vars)
      setShowContrastWarning(!validation.valid)
    }
  }

  // Determine if a built-in theme is selected
  const selectedThemeId = value?.customAccent ? null : value?.themeId || null

  // Generate preview for custom color
  const customPreview =
    customHex && /^#[0-9a-fA-F]{6}$/.test(customHex)
      ? generateThemeWithMode(customHex, 'Custom', 'custom', '', currentMode)
      : null

  return (
    <div className="space-y-4">
      {/* Dark/Light mode toggle */}
      <div className="flex overflow-hidden rounded-lg border border-neutral-200">
        <button
          type="button"
          onClick={() => handleModeChange('dark')}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
            currentMode === 'dark'
              ? 'bg-neutral-900 text-white'
              : 'bg-white text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <Moon className="h-4 w-4" />
          {t('theme.dark')}
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('light')}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
            currentMode === 'light'
              ? 'border-l border-neutral-200 bg-white text-neutral-900 shadow-inner'
              : 'border-l border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
          }`}
          style={
            currentMode === 'light' ? { boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' } : undefined
          }
        >
          <Sun className="h-4 w-4" />
          {t('theme.light')}
        </button>
      </div>

      {/* Built-in palette grid */}
      <div className="grid grid-cols-2 gap-3">
        {Object.values(BUILT_IN_THEMES).map((theme) => {
          const isSelected = selectedThemeId === theme.id
          const isDefault = !value && theme.id === 'tech-modern'
          const previewTheme = generateThemeWithMode(
            theme.accentHex,
            theme.name,
            theme.id,
            theme.emoji,
            currentMode,
          )

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => handleThemeClick(theme.id)}
              className={`relative overflow-hidden rounded-md border-2 transition-all ${isSelected ? 'scale-105 ring-2' : 'border-transparent'} ${isDefault ? 'opacity-80' : ''} hover:scale-105`}
              style={{
                borderColor: isSelected ? theme.vars['--accent'] : 'transparent',
                boxShadow: isSelected ? `0 0 0 2px ${theme.vars['--accent']}40` : 'none',
              }}
            >
              {/* Color swatch strip showing mode preview */}
              <div className="flex h-8">
                <div className="flex-1" style={{ backgroundColor: previewTheme.vars['--bg'] }} />
                <div
                  className="flex-1"
                  style={{ backgroundColor: previewTheme.vars['--surface'] }}
                />
                <div
                  className="flex-1"
                  style={{ backgroundColor: previewTheme.vars['--accent'] }}
                />
              </div>

              {/* Theme name */}
              <div className="bg-white px-3 py-2">
                <p className="text-sm font-medium text-neutral-900">
                  {theme.name}
                  {isDefault && !value && (
                    <span className="ml-1 text-xs text-neutral-500">
                      ({t('eventDetail.defaultTheme').split(' ')[0]})
                    </span>
                  )}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Custom color section */}
      <div className="space-y-2 border-t border-neutral-200 pt-2">
        <label className="text-sm font-medium text-neutral-700">{t('theme.customAccent')}</label>

        <div className="flex items-center gap-3">
          {/* Native color picker */}
          <input
            type="color"
            value={customHex}
            onChange={(e) => handleCustomChange(e.target.value)}
            className="h-10 w-10 cursor-pointer rounded border border-neutral-300"
          />

          {/* Hex input */}
          <input
            type="text"
            value={customHex}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="#00d9ff"
            maxLength={7}
            className="w-32 rounded border border-neutral-300 px-3 py-2 font-mono text-sm"
          />

          {/* Active indicator */}
          {value?.customAccent && (
            <span className="text-xs text-neutral-600">{t('eventDetail.customTheme')}</span>
          )}
        </div>

        {/* Contrast warning */}
        {showContrastWarning && value?.customAccent && (
          <p className="text-sm" style={{ color: 'var(--warning, #f59e0b)' }}>
            {t('theme.contrastWarning')}
          </p>
        )}

        {/* Custom color preview */}
        {customPreview && value?.customAccent && (
          <div className="mt-3 overflow-hidden rounded border border-neutral-200">
            <div className="flex h-6">
              <div className="flex-1" style={{ backgroundColor: customPreview.vars['--bg'] }} />
              <div
                className="flex-1"
                style={{ backgroundColor: customPreview.vars['--surface'] }}
              />
              <div className="flex-1" style={{ backgroundColor: customPreview.vars['--accent'] }} />
              <div
                className="flex-1"
                style={{ backgroundColor: customPreview.vars['--text-sec'] }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
