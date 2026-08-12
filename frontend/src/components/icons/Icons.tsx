import type { ReactNode, SVGProps } from 'react';

// Local Lucide source mappings and modification guidance live in ./README.md.
export type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

interface LucideIconProps extends IconProps {
  readonly children: ReactNode;
}

function LucideIcon({ children, ...props }: LucideIconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
}

export function BrandMarkIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="3" />
      <path d="m16 16-1.9-1.9" />
    </LucideIcon>
  );
}

export function CaretIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="m9 18 6-6-6-6" />
    </LucideIcon>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </LucideIcon>
  );
}

export function ProjectIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
      <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
      <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
    </LucideIcon>
  );
}

export function FolderProjectIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </LucideIcon>
  );
}

export function TerminalProjectIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="m7 11 2-2-2-2" />
      <path d="M11 13h4" />
      <rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
    </LucideIcon>
  );
}

export function ShieldProjectIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </LucideIcon>
  );
}

export function ChartProjectIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M5 21v-6" />
      <path d="M12 21V9" />
      <path d="M19 21V3" />
    </LucideIcon>
  );
}

export function SparkleProjectIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      <path d="M20 2v4" />
      <path d="M22 4h-4" />
      <circle cx="4" cy="20" r="2" />
    </LucideIcon>
  );
}

export function GlobeProjectIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </LucideIcon>
  );
}

export function RequirementsIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <rect height="4" rx="1" ry="1" width="8" x="8" y="2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </LucideIcon>
  );
}

export function CodebaseIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="m18 16 4-4-4-4" />
      <path d="m6 8-4 4 4 4" />
      <path d="m14.5 4-5 16" />
    </LucideIcon>
  );
}

export function ReportIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
      <path d="M14 2v5a1 1 0 0 0 1 1h5" />
      <path d="M8 18v-1" />
      <path d="M12 18v-6" />
      <path d="M16 18v-3" />
    </LucideIcon>
  );
}

export function LogsIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M3 5h1" />
      <path d="M3 12h1" />
      <path d="M3 19h1" />
      <path d="M8 5h1" />
      <path d="M8 12h1" />
      <path d="M8 19h1" />
      <path d="M13 5h8" />
      <path d="M13 12h8" />
      <path d="M13 19h8" />
    </LucideIcon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M20 6 9 17l-5-5" />
    </LucideIcon>
  );
}

export function WarningIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </LucideIcon>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </LucideIcon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </LucideIcon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
    </LucideIcon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M4 5h16" />
      <path d="M4 12h16" />
      <path d="M4 19h16" />
    </LucideIcon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </LucideIcon>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
      <path d="m15 5 4 4" />
    </LucideIcon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </LucideIcon>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M12 15V3" />
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
    </LucideIcon>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </LucideIcon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </LucideIcon>
  );
}

export function PanelLeftCloseIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <rect height="18" rx="2" width="18" x="3" y="3" />
      <path d="M9 3v18" />
      <path d="m16 15-3-3 3-3" />
    </LucideIcon>
  );
}

export function PanelLeftOpenIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <rect height="18" rx="2" width="18" x="3" y="3" />
      <path d="M9 3v18" />
      <path d="m14 9 3 3-3 3" />
    </LucideIcon>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </LucideIcon>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M12 3v12" />
      <path d="m17 8-5-5-5 5" />
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    </LucideIcon>
  );
}

export function CircleCheckIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </LucideIcon>
  );
}

export function CircleXIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </LucideIcon>
  );
}

export function CircleAlertIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </LucideIcon>
  );
}
