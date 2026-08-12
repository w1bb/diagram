import type { ReportEvidenceLocation } from '../model/report';

export function formatEvidenceLocation(evidence: ReportEvidenceLocation): string {
  return `${evidence.path}:${evidence.line}:${evidence.column}`;
}

export function githubEvidenceUrl(
  evidence: ReportEvidenceLocation,
): string | undefined {
  let repositoryUrl: URL;

  try {
    repositoryUrl = new URL(evidence.repositoryUrl);
  } catch {
    return undefined;
  }

  if (
    repositoryUrl.protocol !== 'https:'
    || repositoryUrl.hostname.toLocaleLowerCase() !== 'github.com'
    || repositoryUrl.username
    || repositoryUrl.password
  ) {
    return undefined;
  }

  const repositorySegments = repositoryUrl.pathname
    .replace(/\/$/, '')
    .split('/')
    .filter(Boolean);
  const evidenceSegments = evidence.path.split('/');

  if (
    repositorySegments.length !== 2
    || evidenceSegments.length === 0
    || evidenceSegments.some((segment) => !segment || segment === '.' || segment === '..')
    || !/^[a-f0-9]{7,40}$/i.test(evidence.revision)
    || !Number.isInteger(evidence.line)
    || evidence.line < 1
    || !Number.isInteger(evidence.column)
    || evidence.column < 1
  ) {
    return undefined;
  }

  const repositoryName = repositorySegments[1]?.replace(/\.git$/i, '');
  const repositoryPath = [repositorySegments[0], repositoryName]
    .filter((segment): segment is string => Boolean(segment))
    .map(encodeURIComponent)
    .join('/');
  const filePath = evidenceSegments.map(encodeURIComponent).join('/');
  const plainTextQuery = /\.md(?:own)?$/i.test(evidence.path) ? '?plain=1' : '';

  return `${repositoryUrl.origin}/${repositoryPath}/blob/${encodeURIComponent(evidence.revision)}/${filePath}${plainTextQuery}#L${evidence.line}`;
}
