import type { Config } from 'tailwindcss'

import { notionThemeTokens } from './src/lib/theme'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bgPrimary: notionThemeTokens.bgPrimary,
        bgSurface: notionThemeTokens.bgSurface,
        border: notionThemeTokens.border,
        textPrimary: notionThemeTokens.textPrimary,
        textMuted: notionThemeTokens.textMuted,
        accentGreen: notionThemeTokens.accentGreen,
        amber: notionThemeTokens.amber,
        danger: notionThemeTokens.danger,
      },
    },
  },
  plugins: [],
}

export default config
