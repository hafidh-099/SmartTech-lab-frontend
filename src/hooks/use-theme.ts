import { useTheme as useNextTheme } from 'next-themes'

export function useTheme() {
  const { theme, resolvedTheme, setTheme } = useNextTheme()
  return { theme, resolvedTheme, setTheme }
}
