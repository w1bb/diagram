import type { ComponentType, SVGProps } from 'react';

import {
  ChartProjectIcon,
  FolderProjectIcon,
  GlobeProjectIcon,
  ProjectIcon,
  ShieldProjectIcon,
  SparkleProjectIcon,
  TerminalProjectIcon,
} from '../../../../components/icons/Icons';
import type { ProjectIconName } from '../../model/project';

interface ProjectGlyphProps {
  readonly className?: string | undefined;
  readonly icon: ProjectIconName;
}

interface ProjectIconOption {
  readonly label: string;
  readonly value: ProjectIconName;
}

type IconComponent = ComponentType<Omit<SVGProps<SVGSVGElement>, 'children'>>;

const iconComponents: Record<ProjectIconName, IconComponent> = {
  layers: ProjectIcon,
  folder: FolderProjectIcon,
  terminal: TerminalProjectIcon,
  shield: ShieldProjectIcon,
  chart: ChartProjectIcon,
  sparkles: SparkleProjectIcon,
  globe: GlobeProjectIcon,
};

export const projectIconOptions: readonly ProjectIconOption[] = [
  { value: 'layers', label: 'Layers' },
  { value: 'folder', label: 'Folder' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'shield', label: 'Shield' },
  { value: 'chart', label: 'Chart' },
  { value: 'sparkles', label: 'Sparkles' },
  { value: 'globe', label: 'Globe' },
];

export function ProjectGlyph({ className, icon }: ProjectGlyphProps) {
  const Icon = iconComponents[icon];
  return <Icon className={className} data-project-icon={icon} />;
}
