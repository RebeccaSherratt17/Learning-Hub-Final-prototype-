import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Diligent brand — primary (reds)
        'diligent-red': '#EE312E',
        'diligent-red-2': '#D3222A',
        'diligent-red-3': '#AF292E',
        'diligent-red-4': '#921A1D',
        'diligent-red-5': '#5F091D',
        // Diligent brand — neutrals
        'diligent-gray-1': '#F3F3F3',
        'diligent-gray-2': '#DADADA',
        'diligent-gray-3': '#A0A2A5',
        'diligent-gray-4': '#6F7377',
        'diligent-gray-5': '#282E37',
        // Diligent brand — data viz (charts only, not UI)
        'diligent-blue-1': '#00D3F3',
        'diligent-blue-2': '#0086FA',
        'diligent-blue-3': '#0B4CCE',
        'diligent-purple-1': '#C247FA',
        'diligent-purple-2': '#8B4BFA',
        'diligent-purple-3': '#642FCF',
        // Semantic
        link: '#0B4CCE', // Blue 3, per brand spec
      },
      fontFamily: {
        sans: [
          'var(--font-plus-jakarta)',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        'display-1': ['clamp(2.5rem, 4vw + 1rem, 4rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-2': ['clamp(2rem, 3vw + 0.5rem, 3rem)', { lineHeight: '1.15' }],
        'heading-1': ['clamp(1.75rem, 3vw + 0.5rem, 3rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'heading-2': ['1.5rem', { lineHeight: '1.3' }],
        'heading-3': ['1.25rem', { lineHeight: '1.35' }],
      },
    },
  },
  plugins: [],
}
export default config
