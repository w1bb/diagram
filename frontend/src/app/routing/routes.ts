import type { ProjectSection } from '../../features/projects/model/project';

export type AppRoute =
  | { readonly name: 'home' }
  | {
      readonly name: 'project';
      readonly projectId: string;
      readonly section: ProjectSection;
    }
  | { readonly name: 'not-found'; readonly pathname: string };

export interface RouteResolution {
  readonly route: AppRoute;
  readonly redirectTo?: string;
}

const projectRoutePattern = /^\/projects\/([^/]+)\/(requirements|codebase|report|logs)$/;
const projectRootPattern = /^\/projects\/([^/]+)$/;

function safeDecodePathSegment(segment: string): string | undefined {
  try {
    return decodeURIComponent(segment);
  } catch {
    return undefined;
  }
}

function trimTrailingSlashes(pathname: string): string {
  if (pathname === '/') {
    return pathname;
  }

  return pathname.replace(/\/+$/, '');
}

export function projectPath(projectId: string, section: ProjectSection): string {
  return `/projects/${encodeURIComponent(projectId)}/${section}`;
}

export function resolvePath(pathname: string): RouteResolution {
  const normalizedPath = trimTrailingSlashes(pathname);

  if (normalizedPath === '/') {
    return {
      route: { name: 'home' },
      ...(pathname === normalizedPath ? {} : { redirectTo: normalizedPath }),
    };
  }

  if (normalizedPath === '/projects') {
    return { route: { name: 'home' }, redirectTo: '/' };
  }

  const projectRootMatch = projectRootPattern.exec(normalizedPath);
  if (projectRootMatch) {
    const projectId = safeDecodePathSegment(projectRootMatch[1] ?? '');
    if (projectId) {
      const redirectTo = projectPath(projectId, 'requirements');
      return {
        route: { name: 'project', projectId, section: 'requirements' },
        redirectTo,
      };
    }
  }

  const projectRouteMatch = projectRoutePattern.exec(normalizedPath);
  if (projectRouteMatch) {
    const projectId = safeDecodePathSegment(projectRouteMatch[1] ?? '');
    const section = projectRouteMatch[2] as ProjectSection | undefined;

    if (projectId && section) {
      const canonicalPath = projectPath(projectId, section);
      return {
        route: { name: 'project', projectId, section },
        ...(pathname === canonicalPath ? {} : { redirectTo: canonicalPath }),
      };
    }
  }

  return { route: { name: 'not-found', pathname } };
}
