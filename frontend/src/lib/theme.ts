export const notionThemeTokens = {
  bgPrimary: '#FCFBF7', // Off-white main
  bgSurface: '#F5F4F0', // Slightly darker off-white for contrast
  border: '#E8E7E0',
  textPrimary: '#111111', // Almost black
  textMuted: '#555555',
  accentGreen: '#FACC15', // Vibrant Yellow (Secondary)
  amber: '#D97706',
  danger: '#EF4444',
} as const

export type NotionThemeToken = keyof typeof notionThemeTokens
