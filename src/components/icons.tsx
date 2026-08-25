/* Jeu d'icônes SVG dessinées sur mesure — trait 1.8, bouts arrondis. */

const paths: Record<string, React.ReactNode> = {
  snow: (
    <>
      <path d="M12 3v18M12 3l-2.2 2.6M12 3l2.2 2.6M12 21l-2.2-2.6M12 21l2.2-2.6" />
      <path d="M4.2 7.5l15.6 9M4.2 7.5l.4 3.4M4.2 7.5l3.3-.9M19.8 16.5l-.4-3.4M19.8 16.5l-3.3.9" />
      <path d="M19.8 7.5l-15.6 9M19.8 7.5l-3.3-.9M19.8 7.5l-.4 3.4M4.2 16.5l3.3.9M4.2 16.5l.4-3.4" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="1" />
      <rect x="13.5" y="10.5" width="7" height="10" rx="1" />
      <rect x="3.5" y="13" width="7" height="7.5" rx="1" />
    </>
  ),
  ac: (
    <>
      <rect x="2.8" y="5" width="18.4" height="9.5" rx="1.6" />
      <path d="M6 9h9M17.5 9h.8" />
      <path d="M6 12h12.3" />
      <path d="M7.5 17.5c0 1.6-1.2 1.6-1.2 3M12 17.5c0 1.6-1.2 1.6-1.2 3M16.5 17.5c0 1.6-1.2 1.6-1.2 3" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0c0 5.4 6.5 11 6.5 11z" />
      <circle cx="12" cy="9.8" r="2.4" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V5.5L12 3v18M12 8l8 2.2V21M4 21h16" />
      <path d="M7 8.5h2M7 12h2M7 15.5h2M15 13h2M15 16.5h2" />
    </>
  ),
  swap: (
    <>
      <path d="M4 8h13M14 4.5L17.5 8 14 11.5" />
      <path d="M20 16H7M10 12.5L6.5 16l3.5 3.5" />
    </>
  ),
  wrench: (
    <>
      <path d="M14.2 6.3a4.2 4.2 0 0 1 5-5l-2.6 2.6.6 2.9 2.9.6L22.7 4.8a4.2 4.2 0 0 1-5 5L8.3 19.2a2 2 0 1 1-2.9-2.9l8.8-10z" transform="scale(0.92) translate(1,1)" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4.5" width="14" height="16.5" rx="1.6" />
      <path d="M9 4.5V3h6v1.5" />
      <path d="M8.5 10h7M8.5 13.5h7M8.5 17h4" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5L22 20H2L12 3.5z" />
      <path d="M12 9.5v5M12 17.2v.3" />
    </>
  ),
  report: (
    <>
      <path d="M6 3.5h9l4 4V20.5H6z" />
      <path d="M15 3.5v4h4" />
      <path d="M9 12h7M9 15.5h7M9 8.5h3" />
    </>
  ),
  scroll: (
    <>
      <path d="M5 4.5h13a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 18 19.5H6.5A1.5 1.5 0 0 1 5 18V4.5z" />
      <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" />
    </>
  ),
  lock: (
    <>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="1.6" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14.5v2" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16v-5.5a6 6 0 1 1 12 0V16l1.5 2.5H4.5L6 16z" />
      <path d="M10 21a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L21 21" />
    </>
  ),
  out: (
    <>
      <path d="M14 4.5H6v15h8" />
      <path d="M10.5 12H21M17.5 8.5L21 12l-3.5 3.5" />
    </>
  ),
  chevR: <path d="M9 5.5l6.5 6.5L9 18.5" />,
  chevD: <path d="M5.5 9l6.5 6.5L18.5 9" />,
  plus: <path d="M12 4.5v15M4.5 12h15" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  qr: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="0.8" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="0.8" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="0.8" />
      <path d="M13.5 13.5h3v3h-3zM17 17h3v3h-3zM13.5 20h.5" />
    </>
  ),
  arrow: <path d="M3.5 12h16M14 6.5l5.5 5.5L14 17.5" />,
  filter: <path d="M4 5.5h16L14 13v6.5l-4-2V13L4 5.5z" />,
  download: (
    <>
      <path d="M12 3.5v11M7.5 10L12 14.5 16.5 10" />
      <path d="M4.5 17v3.5h15V17" />
    </>
  ),
  check: <path d="M4.5 12.5l5 5L19.5 7" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.2l3.4 2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c1.3-3.6 4.1-5.5 7.5-5.5s6.2 1.9 7.5 5.5" />
    </>
  ),
  box: (
    <>
      <path d="M3.5 7.5L12 3.5l8.5 4v9L12 20.5l-8.5-4v-9z" />
      <path d="M3.5 7.5L12 11.5l8.5-4M12 11.5v9" />
    </>
  ),
  history: (
    <>
      <path d="M4 12a8 8 0 1 1 2.3 5.7M4 12l-1.5-3M4 12l3.2-.6" />
      <path d="M12 8v4.2l3 1.8" />
    </>
  ),
  truck: (
    <>
      <path d="M2.8 6h11.4v10H2.8zM14.2 9.5h4l2.8 3.5v3h-2.6" />
      <circle cx="7" cy="17.6" r="1.9" />
      <circle cx="16.8" cy="17.6" r="1.9" />
      <path d="M9 16h5.9" />
    </>
  ),
  thermo: (
    <>
      <path d="M10 4a2 2 0 1 1 4 0v9.3a4.2 4.2 0 1 1-4 0V4z" />
      <path d="M12 9v7" />
    </>
  ),
  scan: (
    <>
      <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
      <path d="M7.5 12h9" />
    </>
  ),
  tag: (
    <>
      <path d="M3.5 11.5v-8h8L21 13l-8.5 8.5-9-10z" transform="translate(0,-0.5)" />
      <circle cx="8" cy="8" r="1.6" />
    </>
  ),
};

export function Icon({ name, className = "w-4 h-4", strokeWidth = 1.8 }: { name: keyof typeof paths | string; className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name] ?? <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}
