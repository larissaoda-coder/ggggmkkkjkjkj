import type { ReactElement, SVGProps } from 'react';

/**
 * Ícones de traço fino, desenhados para este app (24×24, traço 1.25).
 * Todos herdam `currentColor`.
 */
export type IconName =
  | 'home'
  | 'index'
  | 'letter'
  | 'fragments'
  | 'choices'
  | 'music'
  | 'labyrinth'
  | 'table'
  | 'night'
  | 'path'
  | 'interval'
  | 'settings'
  | 'more'
  | 'play'
  | 'pause'
  | 'next'
  | 'prev'
  | 'volume'
  | 'volume-off'
  | 'sun'
  | 'moon'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'close'
  | 'undo'
  | 'reset'
  | 'save'
  | 'plus'
  | 'minus'
  | 'external'
  | 'check'
  | 'lock'
  | 'history'
  | 'sound'
  | 'sound-off'
  | 'star'
  | 'trash'
  | 'text-size'
  | 'pause-circle'
  | 'shuffle'
  | 'skip';

const paths: Record<IconName, ReactElement> = {
  home: <path d="M4 11 12 4l8 7M6.5 9.5V20h11V9.5" />,
  index: (
    <>
      <path d="M5 6h14M5 12h14M5 18h9" />
    </>
  ),
  letter: (
    <>
      <rect x="3.5" y="6" width="17" height="12" rx="0.5" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </>
  ),
  fragments: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" />
    </>
  ),
  choices: (
    <>
      <circle cx="6" cy="18" r="1.75" />
      <circle cx="18" cy="6" r="1.75" />
      <circle cx="18" cy="18" r="1.75" />
      <path d="M6 16.25V12a4 4 0 0 1 4-4h6.25M7.75 18h8.5" />
    </>
  ),
  music: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.25" />
      <path d="M12 3.5a8.5 8.5 0 0 1 6 2.5" />
    </>
  ),
  labyrinth: (
    <>
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="5" cy="6" r="1.2" />
      <circle cx="19" cy="7" r="1.2" />
      <circle cx="6" cy="18.5" r="1.2" />
      <circle cx="18" cy="18" r="1.2" />
      <path d="m10.7 11-4.6-4.1M13.5 11.2l4.4-3.5M10.8 13.1l-3.9 4.4M13.4 13l3.7 4.1" />
    </>
  ),
  table: (
    <>
      <path d="M3 15.5h18M5.5 15.5 4 20M18.5 15.5 20 20" />
      <rect x="6" y="9" width="4.5" height="6.5" />
      <rect x="12.5" y="6.5" width="5" height="9" />
    </>
  ),
  night: <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" />,
  path: (
    <>
      <path d="M5 20c0-4 3-5 6-6s6-2.5 6-6.5" strokeDasharray="2 2.5" />
      <circle cx="5" cy="20" r="1.3" />
      <path d="M17 3.5v4M15 5.5h4" />
    </>
  ),
  interval: (
    <>
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.1" />
      <circle cx="12" cy="12" r="1.1" />
      <circle cx="18.5" cy="12" r="1.1" />
    </>
  ),
  play: <path d="M8 5.5v13l10.5-6.5L8 5.5Z" />,
  pause: <path d="M8.5 5.5v13M15.5 5.5v13" />,
  next: <path d="M6 6v12l8.5-6L6 6ZM17.5 6v12" />,
  prev: <path d="M18 6v12l-8.5-6L18 6ZM6.5 6v12" />,
  volume: <path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3v-5ZM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />,
  'volume-off': <path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3v-5ZM16 9.5l5 5M21 9.5l-5 5" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="3.75" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </>
  ),
  moon: <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" />,
  'arrow-left': <path d="M19 12H5.5M11 6l-6 6 6 6" />,
  'arrow-right': <path d="M5 12h13.5M13 6l6 6-6 6" />,
  'arrow-up': <path d="M12 19V5.5M6 11l6-6 6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  undo: <path d="M9 7 5 11l4 4M5 11h9.5a4.5 4.5 0 0 1 0 9H12" />,
  reset: <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v3.5H8" />,
  save: <path d="M5 4.5h11l3 3V19.5H5V4.5ZM8 4.5v5h7v-5M8 19.5v-5.5h8v5.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  external: <path d="M13.5 5H19v5.5M19 5l-8 8M17 14v5H5V7h5" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  lock: (
    <>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="0.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  history: <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v3.5H8M12 8v4.5l3 2" />,
  sound: <path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3v-5ZM15.5 9a4 4 0 0 1 0 6" />,
  'sound-off': <path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3v-5ZM16 10l4 4M20 10l-4 4" />,
  star: <path d="m12 4 1.9 5.6H20l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8L4 9.6h6.1L12 4Z" />,
  trash: <path d="M5 7h14M10 7V4.5h4V7M7 7l.8 12.5h8.4L17 7" />,
  'text-size': <path d="M3.5 19 8 6l4.5 13M5 15h6M14.5 19l3-8.5 3 8.5M15.5 16.5h4" />,
  'pause-circle': (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M10 9v6M14 9v6" />
    </>
  ),
  shuffle: (
    <path d="M4 7h3.5c4 0 5 10 9 10H20M4 17h3.5c1.6 0 2.6-1.6 3.4-3.5M13.1 9.5C13.9 8 14.9 7 16.5 7H20M17.5 4.5 20 7l-2.5 2.5M17.5 14.5 20 17l-2.5 2.5" />
  ),
  skip: <path d="M5 6l7 6-7 6V6ZM12 6l7 6-7 6V6Z" />,
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
  title?: string;
}

export function Icon({ name, size = 20, title, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {paths[name]}
    </svg>
  );
}
