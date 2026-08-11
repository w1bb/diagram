import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createMockRepositoryMetadata } from '../data/codebases.fixture';
import type {
  CodebaseWorkspaceItem,
  MockCodebaseSnapshot,
  MockSnapshotSelection,
} from '../model/codebase';

const SIMULATED_OPERATION_DURATION = 2000;

function createDraftCodebase(): CodebaseWorkspaceItem {
  return {
    credentialConfigured: false,
    id: crypto.randomUUID(),
    repository: undefined,
    selectedBranch: '',
    selectedCommit: '',
    status: 'draft',
    token: '',
    url: '',
  };
}

function isHttpsRepositoryUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.length > 0;
  } catch {
    return false;
  }
}

function normalizeRepositoryUrl(value: string): string {
  return value.trim().replace(/\/$/, '').toLocaleLowerCase();
}

function snapshotInputSignature(
  codebases: readonly CodebaseWorkspaceItem[],
  configurationRevision: number,
): string {
  const selections = codebases.map((codebase) => ({
    branch: codebase.selectedBranch,
    commit: codebase.selectedCommit,
    id: codebase.id,
    url: normalizeRepositoryUrl(codebase.url),
  }));

  return JSON.stringify({ configurationRevision, selections });
}

export function useCodebaseWorkspace(projectId: string) {
  const [codebases, setCodebases] = useState<readonly CodebaseWorkspaceItem[]>(() => [
    createDraftCodebase(),
  ]);
  const [configurationRevision, setConfigurationRevision] = useState(0);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [snapshot, setSnapshot] = useState<MockCodebaseSnapshot | undefined>();
  const [validatedConfigurationRevision, setValidatedConfigurationRevision] = useState<number | undefined>();
  const snapshotTimerRef = useRef<number | undefined>(undefined);
  const validationTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setCodebases([createDraftCodebase()]);
    setConfigurationRevision(0);
    setIsCreatingSnapshot(false);
    setIsValidating(false);
    setSnapshot(undefined);
    setValidatedConfigurationRevision(undefined);

    return () => {
      if (validationTimerRef.current !== undefined) {
        window.clearTimeout(validationTimerRef.current);
        validationTimerRef.current = undefined;
      }

      if (snapshotTimerRef.current !== undefined) {
        window.clearTimeout(snapshotTimerRef.current);
        snapshotTimerRef.current = undefined;
      }
    };
  }, [projectId]);

  const isBusy = isCreatingSnapshot || isValidating;
  const hasValidation = validatedConfigurationRevision !== undefined;
  const isValidationStale =
    hasValidation && validatedConfigurationRevision !== configurationRevision;
  const normalizedUrls = codebases
    .map((codebase) => normalizeRepositoryUrl(codebase.url))
    .filter(Boolean);
  const hasDuplicateUrls = new Set(normalizedUrls).size !== normalizedUrls.length;
  const hasCompleteDrafts = codebases.every(
    (codebase) =>
      codebase.status === 'validated' ||
      (isHttpsRepositoryUrl(codebase.url.trim()) && codebase.token.trim().length > 0),
  );
  const canStartValidation =
    !isBusy &&
    codebases.length > 0 &&
    hasCompleteDrafts &&
    !hasDuplicateUrls &&
    (!hasValidation || isValidationStale);

  const currentSnapshotInputSignature = useMemo(
    () => snapshotInputSignature(codebases, configurationRevision),
    [codebases, configurationRevision],
  );
  const hasCompleteSelections = codebases.every(
    (codebase) =>
      codebase.status === 'validated' &&
      codebase.repository !== undefined &&
      codebase.selectedBranch.length > 0 &&
      codebase.selectedCommit.length > 0,
  );
  const canCreateSnapshot =
    !isBusy &&
    hasValidation &&
    !isValidationStale &&
    codebases.length > 0 &&
    hasCompleteSelections;
  const isSnapshotStale =
    snapshot !== undefined && snapshot.inputSignature !== currentSnapshotInputSignature;

  const addCodebase = useCallback(() => {
    if (isBusy) {
      return false;
    }

    setCodebases((currentCodebases) => [...currentCodebases, createDraftCodebase()]);
    setConfigurationRevision((currentRevision) => currentRevision + 1);
    return true;
  }, [isBusy]);

  const updateDraftCodebase = useCallback((
    codebaseId: string,
    field: 'token' | 'url',
    value: string,
  ) => {
    if (isBusy) {
      return;
    }

    setCodebases((currentCodebases) =>
      currentCodebases.map((codebase) =>
        codebase.id === codebaseId && codebase.status === 'draft'
          ? { ...codebase, [field]: value }
          : codebase,
      ),
    );
  }, [isBusy]);

  const deleteCodebase = useCallback((codebaseId: string) => {
    if (isBusy) {
      return false;
    }

    setCodebases((currentCodebases) =>
      currentCodebases.filter((codebase) => codebase.id !== codebaseId),
    );
    setConfigurationRevision((currentRevision) => currentRevision + 1);
    return true;
  }, [isBusy]);

  const startValidation = useCallback(() => {
    if (!canStartValidation) {
      return false;
    }

    const submittedRevision = configurationRevision;
    setIsValidating(true);

    validationTimerRef.current = window.setTimeout(() => {
      validationTimerRef.current = undefined;
      setCodebases((currentCodebases) =>
        currentCodebases.map((codebase, index) => {
          if (codebase.status === 'validated') {
            return codebase;
          }

          const repository = createMockRepositoryMetadata(codebase.url.trim(), index);
          const defaultBranch = repository.branches.find(
            (branch) => branch.name === repository.defaultBranch,
          );
          const latestCommit = defaultBranch?.commits[0];

          return {
            ...codebase,
            credentialConfigured: true,
            repository,
            selectedBranch: defaultBranch?.name ?? '',
            selectedCommit: latestCommit?.sha ?? '',
            status: 'validated',
            token: '',
            url: codebase.url.trim(),
          };
        }),
      );
      setValidatedConfigurationRevision(submittedRevision);
      setIsValidating(false);
    }, SIMULATED_OPERATION_DURATION);

    return true;
  }, [canStartValidation, configurationRevision]);

  const selectBranch = useCallback((codebaseId: string, branchName: string) => {
    if (isBusy) {
      return;
    }

    setCodebases((currentCodebases) =>
      currentCodebases.map((codebase) => {
        if (codebase.id !== codebaseId || codebase.status !== 'validated') {
          return codebase;
        }

        const branch = codebase.repository?.branches.find(
          (candidate) => candidate.name === branchName,
        );

        if (!branch) {
          return codebase;
        }

        return {
          ...codebase,
          selectedBranch: branch.name,
          selectedCommit: branch.commits[0]?.sha ?? '',
        };
      }),
    );
  }, [isBusy]);

  const selectCommit = useCallback((codebaseId: string, commitSha: string) => {
    if (isBusy) {
      return;
    }

    setCodebases((currentCodebases) =>
      currentCodebases.map((codebase) => {
        if (codebase.id !== codebaseId || codebase.status !== 'validated') {
          return codebase;
        }

        const branch = codebase.repository?.branches.find(
          (candidate) => candidate.name === codebase.selectedBranch,
        );
        const commitExists = branch?.commits.some((commit) => commit.sha === commitSha);

        return commitExists ? { ...codebase, selectedCommit: commitSha } : codebase;
      }),
    );
  }, [isBusy]);

  const startSnapshotCreation = useCallback(() => {
    if (!canCreateSnapshot) {
      return false;
    }

    const inputSignature = currentSnapshotInputSignature;
    const selections: readonly MockSnapshotSelection[] = codebases.map((codebase) => ({
      branch: codebase.selectedBranch,
      codebaseId: codebase.id,
      commit: codebase.selectedCommit,
      repositoryName: codebase.repository?.displayName ?? 'Git repository',
      repositoryUrl: codebase.url,
    }));
    setIsCreatingSnapshot(true);

    snapshotTimerRef.current = window.setTimeout(() => {
      snapshotTimerRef.current = undefined;
      setSnapshot({
        createdAt: new Date().toISOString(),
        id: crypto.randomUUID(),
        inputSignature,
        selections,
      });
      setIsCreatingSnapshot(false);
    }, SIMULATED_OPERATION_DURATION);

    return true;
  }, [canCreateSnapshot, codebases, currentSnapshotInputSignature]);

  return {
    addCodebase,
    canCreateSnapshot,
    canStartValidation,
    codebases,
    deleteCodebase,
    hasDuplicateUrls,
    hasValidation,
    hasUnvalidatedCodebases: codebases.some((codebase) => codebase.status === 'draft'),
    isBusy,
    isCreatingSnapshot,
    isSnapshotStale,
    isValidating,
    isValidationStale,
    selectBranch,
    selectCommit,
    snapshot,
    startSnapshotCreation,
    startValidation,
    updateDraftCodebase,
  } as const;
}
