import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createMockRequirementSet,
} from '../data/requirements.fixture';
import type { DetectedRequirement } from '../model/requirement';

const SIMULATED_UPLOAD_DURATION = 2000;
const SIMULATED_PROCESSING_DURATION = 2200;

export type SourceUploadStatus = 'uploading' | 'uploaded';

export interface RequirementSourceDocument {
  readonly downloadUrl: string;
  readonly file: File;
  readonly id: string;
  readonly status: SourceUploadStatus;
}

export interface MockRequirementSet {
  readonly requirements: readonly DetectedRequirement[];
  readonly sourceRevision: number;
  readonly version: number;
}

function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export function useRequirementsWorkspace(projectId: string) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [requirementSet, setRequirementSet] = useState<MockRequirementSet | undefined>();
  const [sourceDocuments, setSourceDocuments] = useState<readonly RequirementSourceDocument[]>([]);
  const [sourceRevision, setSourceRevision] = useState(0);
  const objectUrlsRef = useRef(new Map<string, string>());
  const processingTimerRef = useRef<number | undefined>(undefined);
  const sourceKeysRef = useRef(new Set<string>());
  const uploadTimersRef = useRef(new Map<string, number>());

  useEffect(() => {
    setIsProcessing(false);
    setRequirementSet(undefined);
    setSourceDocuments([]);
    setSourceRevision(0);

    return () => {
      uploadTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      uploadTimersRef.current.clear();

      if (processingTimerRef.current !== undefined) {
        window.clearTimeout(processingTimerRef.current);
        processingTimerRef.current = undefined;
      }

      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
      sourceKeysRef.current.clear();
    };
  }, [projectId]);

  const addSourceDocuments = useCallback((files: readonly File[]) => {
    const documentsToAdd: RequirementSourceDocument[] = [];

    files.forEach((file) => {
      const key = fileKey(file);

      if (sourceKeysRef.current.has(key)) {
        return;
      }

      const id = crypto.randomUUID();
      const downloadUrl = URL.createObjectURL(file);
      const document: RequirementSourceDocument = {
        downloadUrl,
        file,
        id,
        status: 'uploading',
      };

      sourceKeysRef.current.add(key);
      objectUrlsRef.current.set(id, downloadUrl);
      documentsToAdd.push(document);

      const uploadTimer = window.setTimeout(() => {
        uploadTimersRef.current.delete(id);
        setSourceDocuments((currentDocuments) =>
          currentDocuments.map((currentDocument) =>
            currentDocument.id === id
              ? { ...currentDocument, status: 'uploaded' }
              : currentDocument,
          ),
        );
      }, SIMULATED_UPLOAD_DURATION);

      uploadTimersRef.current.set(id, uploadTimer);
    });

    if (documentsToAdd.length === 0) {
      return 0;
    }

    setSourceDocuments((currentDocuments) => [...currentDocuments, ...documentsToAdd]);
    setSourceRevision((currentRevision) => currentRevision + 1);
    return documentsToAdd.length;
  }, []);

  const deleteSourceDocument = useCallback((document: RequirementSourceDocument) => {
    if (document.status !== 'uploaded' || isProcessing) {
      return;
    }

    sourceKeysRef.current.delete(fileKey(document.file));
    setSourceDocuments((currentDocuments) =>
      currentDocuments.filter((currentDocument) => currentDocument.id !== document.id),
    );
    setSourceRevision((currentRevision) => currentRevision + 1);

    const objectUrl = objectUrlsRef.current.get(document.id);
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrlsRef.current.delete(document.id);
    }
  }, [isProcessing]);

  const canStartProcessing =
    sourceDocuments.length > 0 &&
    sourceDocuments.every((document) => document.status === 'uploaded') &&
    !isProcessing;

  const startProcessing = useCallback(() => {
    if (!canStartProcessing) {
      return false;
    }

    const processingSourceRevision = sourceRevision;
    const processingSourceFilenames = sourceDocuments.map((document) => document.file.name);
    setIsProcessing(true);

    processingTimerRef.current = window.setTimeout(() => {
      processingTimerRef.current = undefined;
      setRequirementSet((currentSet) => ({
        requirements: createMockRequirementSet(processingSourceFilenames),
        sourceRevision: processingSourceRevision,
        version: (currentSet?.version ?? 0) + 1,
      }));
      setIsProcessing(false);
    }, SIMULATED_PROCESSING_DURATION);

    return true;
  }, [canStartProcessing, sourceDocuments, sourceRevision]);

  return {
    addSourceDocuments,
    canStartProcessing,
    deleteSourceDocument,
    isProcessing,
    isRequirementSetStale:
      requirementSet !== undefined && requirementSet.sourceRevision !== sourceRevision,
    requirementSet,
    sourceDocuments,
    startProcessing,
  } as const;
}
