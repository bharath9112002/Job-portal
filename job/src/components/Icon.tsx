import type { IconName } from '../data/dashboardData'

// Simple 24×24 stroke icons, drawn in currentColor.
const PATHS: Record<IconName, string[]> = {
  building: ['M3 21h18', 'M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16', 'M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1', 'M10 21v-3h4v3'],
  briefcase: ['M3 8h18v12H3z', 'M8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3', 'M3 13h18'],
  bolt: ['M13 2 4 14h7l-1 8 9-12h-7z'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  file: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M8 13h8M8 17h5'],
  bookmark: ['M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'],
  plus: ['M12 5v14M5 12h14'],
  grid: ['M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z'],
  check: ['M20 6 9 17l-5-5'],
  x: ['M18 6 6 18M6 6l12 12'],
  calendar: ['M3 5h18v16H3z', 'M16 3v4M8 3v4M3 10h18'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  menu: ['M3 6h18M3 12h18M3 18h18'],
}

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
