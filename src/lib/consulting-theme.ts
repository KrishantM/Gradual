// Consulting theme constants for consistent styling across all /consulting pages

export const consultingTheme = {
  // Backgrounds
  baseBackground: 'bg-slate-50', // #F8F9FB equivalent
  baseBackgroundHex: '#F8F9FB',
  cardBackground: 'bg-white',
  cardBackgroundHex: '#FFFFFF',
  
  // Text colors
  heading: 'text-slate-900', // #0F172A - solid charcoal
  headingHex: '#0F172A',
  body: 'text-slate-600', // #475569 - muted slate
  bodyHex: '#475569',
  muted: 'text-slate-500',
  
  // Borders
  border: 'border-slate-200',
  borderHex: '#E1E7EF',
  
  // Shadows
  cardShadow: 'shadow-sm',
  
  // Spacing
  sectionPadding: 'py-16 md:py-20',
  cardPadding: 'p-6 md:p-8',
  
  // Container widths
  containerMax: 'max-w-5xl',
  textMax: 'max-w-2xl',
  
  // Buttons
  primaryButton: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700',
  secondaryButton: 'border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400',
  
  // Accents (for icons, small elements)
  accentBlue: 'text-blue-600',
  accentPurple: 'text-purple-600',
} as const;


