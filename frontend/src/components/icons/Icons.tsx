import type { SVGProps } from 'react';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

const sharedProps = {
  'aria-hidden': true,
  focusable: 'false',
  viewBox: '0 0 24 24',
} as const;

export function BrandMarkIcon(props: IconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <path
        d="M12 2.75 15.25 6 12 9.25 8.75 6 12 2.75ZM6 8.75 9.25 12 6 15.25 2.75 12 6 8.75ZM18 8.75 21.25 12 18 15.25 14.75 12 18 8.75ZM12 14.75 15.25 18 12 21.25 8.75 18 12 14.75Z"
        fill="currentColor"
      />
      <circle cx="12" cy="12" r="2.35" fill="currentColor" />
    </svg>
  );
}

export function CaretIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m9 7 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="m4 10 8-6.5 8 6.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-9Z" strokeLinejoin="round" />
      <path d="M9.5 20.5v-6h5v6" strokeLinejoin="round" />
    </svg>
  );
}

export function ProjectIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" strokeLinejoin="round" />
      <path d="m4.5 11 7.5 3.75L19.5 11M4.5 15l7.5 3.75L19.5 15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FolderProjectIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3.5 7A2.5 2.5 0 0 1 6 4.5h4l2 2h6A2.5 2.5 0 0 1 20.5 9v8A2.5 2.5 0 0 1 18 19.5H6A2.5 2.5 0 0 1 3.5 17V7Z" strokeLinejoin="round" />
    </svg>
  );
}

export function TerminalProjectIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
      <path d="m7 9 3 3-3 3M12.5 15H17" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShieldProjectIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 3.25 19 6v5.25c0 4.3-2.7 7.7-7 9.5-4.3-1.8-7-5.2-7-9.5V6l7-2.75Z" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChartProjectIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 19.5V5M4 19.5h16" strokeLinecap="round" />
      <path d="M7.5 16v-4M12 16V7.5M16.5 16V10" strokeLinecap="round" />
    </svg>
  );
}

export function SparkleProjectIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 3.5c.55 3.05 2.45 4.95 5.5 5.5-3.05.55-4.95 2.45-5.5 5.5-.55-3.05-2.45-4.95-5.5-5.5 3.05-.55 4.95-2.45 5.5-5.5Z" strokeLinejoin="round" />
      <path d="M18.25 14.5c.25 1.4 1.1 2.25 2.5 2.5-1.4.25-2.25 1.1-2.5 2.5-.25-1.4-1.1-2.25-2.5-2.5 1.4-.25 2.25-1.1 2.5-2.5ZM5.25 14.75c.2 1.05.85 1.7 1.9 1.9-1.05.2-1.7.85-1.9 1.9-.2-1.05-.85-1.7-1.9-1.9 1.05-.2 1.7-.85 1.9-1.9Z" strokeLinejoin="round" />
    </svg>
  );
}

export function GlobeProjectIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.75 12h16.5M12 3.5c2.1 2.3 3.2 5.15 3.2 8.5S14.1 18.2 12 20.5C9.9 18.2 8.8 15.35 8.8 12S9.9 5.8 12 3.5Z" strokeLinecap="round" />
    </svg>
  );
}

export function RequirementsIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="m8 9 1.35 1.35L12 7.7M8 15h.01M13 15h3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CodebaseIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M13.5 4 10.5 20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ReportIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M5 3.5h10l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V3.5Z" strokeLinejoin="round" />
      <path d="M15 3.5V8h4M9 17v-3M12 17v-6M15 17v-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m5 12 4.25 4.25L19 6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WarningIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M10.2 4.2 2.8 17a2 2 0 0 0 1.73 3h14.94a2 2 0 0 0 1.73-3L13.8 4.2a2.08 2.08 0 0 0-3.6 0Z" strokeLinejoin="round" />
      <path d="M12 8.5v5M12 17h.01" strokeLinecap="round" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" strokeLinecap="round" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M20 15.3A8.5 8.5 0 0 1 8.7 4a8.5 8.5 0 1 0 11.3 11.3Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 14.5v4A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4.5 7h15M9 7V4.5h6V7M6.5 7l.75 13h9.5l.75-13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v5M14 11v5" strokeLinecap="round" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.9" {...props}>
      <circle cx="10.75" cy="10.75" r="6.25" />
      <path d="m15.5 15.5 4 4" strokeLinecap="round" />
    </svg>
  );
}

export function PanelLeftCloseIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M8 4v16m7-11-3 3 3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PanelLeftOpenIcon(props: IconProps) {
  return (
    <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M8 4v16m4-11 3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
