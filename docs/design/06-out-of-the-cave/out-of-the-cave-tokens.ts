export const palette = {
  light: {
    surface: '#efe5d3',
    surfaceContainer: '#faf6ee',
    onSurface: '#1e1712',
    onSurfaceVariant: '#4e443a',
    placeholder: '#74685b',
    separator: '#dccfba',
    primary: '#7a4a22',
    onPrimary: '#fbf4e8',
    hintContainer: '#f3dfb0',
    onHintContainer: '#3a2a0e',
    hintIcon: '#94600f',
    gap: '#9a3820',
    shadowBlock: 'rgba(30, 23, 18, 0.12)',
    alone: '#2f6a5b',
    onAlone: '#ffffff',
    aloneContainer: '#d6e7df',
    onAloneContainer: '#1f4a3f',
    glass: 'rgba(255, 252, 245, 0.62)',
  },
  dark: {
    surface: '#1a1511',
    surfaceContainer: '#27201a',
    onSurface: '#ece3d3',
    onSurfaceVariant: '#b8ab98',
    placeholder: '#958978',
    separator: '#3a3129',
    primary: '#c98c4f',
    onPrimary: '#1a1108',
    hintContainer: '#3a2d15',
    onHintContainer: '#f3dfb0',
    hintIcon: '#e9b04a',
    gap: '#ee8b6a',
    shadowBlock: 'rgba(0, 0, 0, 0.32)',
    alone: '#2f6a5b',
    onAlone: '#ffffff',
    aloneContainer: '#213a33',
    onAloneContainer: '#cfe5dc',
    glass: 'rgba(38, 32, 26, 0.58)',
  },
  cave: {
    surface: '#14100c',
    surfaceContainer: '#221b15',
    onSurface: '#ece3d3',
    onSurfaceVariant: '#b1a28e',
    separator: '#3a3028',
    primary: '#f1e8d8',
    onPrimary: '#1e1712',
    shadowBlock: '#2e251d',
    shadowOutline: '#8c7d6a',
    archTop: '#fff6e3',
    archBottom: '#f3d9a4',
    glass: 'rgba(38, 32, 26, 0.58)',
  },
} as const;

export const increasedContrast = {
  light: { onSurfaceVariant: '#3a322a', separator: '#8a7c68', primary: '#5e3818', gap: '#7a2a16' },
  dark: { onSurfaceVariant: '#d6cab8', separator: '#7c6f5e', primary: '#dba06a', gap: '#f4a283' },
} as const;

export const stages = [
  { level: 1, name: 'Sketch', color: null, onColor: null },
  { level: 2, name: 'Clay', color: '#7a6555', onColor: '#ffffff' },
  { level: 3, name: 'Plaster', color: '#ffffff', onColor: '#1e1712' },
  { level: 4, name: 'Bronze', color: '#7a4a22', onColor: '#fbf4e8' },
  { level: 5, name: 'Patina', color: '#2f6a5b', onColor: '#ffffff' },
] as const;

export const type = {
  serif: {
    splash: { fontFamily: 'Newsreader_400Regular', fontSize: 48, lineHeight: 52 },
    largeTitle: { fontFamily: 'Newsreader_500Medium', fontSize: 34, lineHeight: 41 },
    question: { fontFamily: 'Newsreader_400Regular_Italic', fontSize: 28, lineHeight: 34 },
    title: { fontFamily: 'Newsreader_400Regular', fontSize: 28, lineHeight: 34 },
    hero: { fontFamily: 'Newsreader_400Regular', fontSize: 88, lineHeight: 80 },
    body: { fontFamily: 'Newsreader_400Regular', fontSize: 17, lineHeight: 26 },
    bodyItalic: { fontFamily: 'Newsreader_400Regular_Italic', fontSize: 17, lineHeight: 26 },
  },
  system: {
    headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
    body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
    footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
    footnoteStrong: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  },
} as const;

export const space = { xs: 4, s: 8, m: 12, l: 16, margin: 20, xl: 24, xxl: 32 } as const;
export const radius = { chip: 14, card: 20, cardLarge: 24, bubble: 20, sheet: 40, control: 26, iconButton: 22 } as const;
export const size = { touchIOS: 44, touchAndroid: 48, button: 52, smallButton: 44, icon: 20 } as const;
export const motion = { press: 120, feedback: 150, sheet: 240, dawn: 700, castStagger: 90, cast: 280 } as const;
