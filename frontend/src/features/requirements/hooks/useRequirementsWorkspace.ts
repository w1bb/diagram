import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createMockRequirementSet,
} from '../data/requirements.fixture';
import { createMockMarkdownPreview } from '../data/markdownPreview.fixture';
import type { DetectedRequirement } from '../model/requirement';
import {
  createInitialProcessingStages,
  requirementProcessingStageDefinitions,
  type ConvertedMarkdownDocument,
  type RequirementProcessingStage,
} from '../model/requirementProcessing';

const SIMULATED_UPLOAD_DURATION = 2000;
const SIMULATED_STAGE_DURATIONS = [1300, 1500, 1400, 1600] as const;

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
  const [convertedMarkdownDocuments, setConvertedMarkdownDocuments] = useState<
    readonly ConvertedMarkdownDocument[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStages, setProcessingStages] = useState<
    readonly RequirementProcessingStage[]
  >(() => createInitialProcessingStages());
  const [requirementSet, setRequirementSet] = useState<MockRequirementSet | undefined>();
  const [sourceDocuments, setSourceDocuments] = useState<readonly RequirementSourceDocument[]>([]);
  const [sourceRevision, setSourceRevision] = useState(0);
  const objectUrlsRef = useRef(new Map<string, string>());
  const previewUrlsRef = useRef(new Map<string, string>());
  const processingTimerRef = useRef<number | undefined>(undefined);
  const sourceKeysRef = useRef(new Set<string>());
  const uploadTimersRef = useRef(new Map<string, number>());

  useEffect(() => {
    setConvertedMarkdownDocuments([]);
    setIsProcessing(false);
    setProcessingStages(createInitialProcessingStages());
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
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
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

    const previewUrl = previewUrlsRef.current.get(document.id);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrlsRef.current.delete(document.id);
      setConvertedMarkdownDocuments((currentDocuments) =>
        currentDocuments.filter(
          (currentDocument) => currentDocument.sourceDocumentId !== document.id,
        ),
      );
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
    const processingSourceDocuments = [...sourceDocuments];
    const processingSourceFilenames = processingSourceDocuments.map(
      (document) => document.file.name,
    );

    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current.clear();
    setConvertedMarkdownDocuments([]);
    setIsProcessing(true);
    setProcessingStages(createInitialProcessingStages().map((stage, index) => ({
      ...stage,
      status: index === 0 ? 'in-progress' : 'not-started',
    })));

    function completeStage(stageIndex: number) {
      const nextStageIndex = stageIndex + 1;

      processingTimerRef.current = window.setTimeout(() => {
        processingTimerRef.current = undefined;

        if (stageIndex === 0) {
          const convertedDocuments = processingSourceDocuments.map((document) => {
            const preview = createMockMarkdownPreview(document.file);
            const downloadUrl = URL.createObjectURL(
              new Blob([preview.content], { type: 'text/markdown;charset=utf-8' }),
            );

            previewUrlsRef.current.set(document.id, downloadUrl);

            return {
              content: preview.content,
              downloadUrl,
              filename: preview.filename,
              sourceDocumentId: document.id,
              sourceFilename: document.file.name,
            };
          });

          setConvertedMarkdownDocuments(convertedDocuments);
        }

        setProcessingStages((currentStages) => currentStages.map((stage, index) => ({
          ...stage,
          status: index <= stageIndex
            ? 'completed'
            : index === nextStageIndex
              ? 'in-progress'
              : 'not-started',
        })));

        if (nextStageIndex < requirementProcessingStageDefinitions.length) {
          completeStage(nextStageIndex);
          return;
        }

        setRequirementSet((currentSet) => ({
          requirements: createMockRequirementSet(processingSourceFilenames),
          sourceRevision: processingSourceRevision,
          version: (currentSet?.version ?? 0) + 1,
        }));
        setIsProcessing(false);
      }, SIMULATED_STAGE_DURATIONS[stageIndex]);
    }

    completeStage(0);

    return true;
  }, [canStartProcessing, sourceDocuments, sourceRevision]);

  return {
    addSourceDocuments,
    canStartProcessing,
    convertedMarkdownDocuments,
    deleteSourceDocument,
    isProcessing,
    isRequirementSetStale:
      requirementSet !== undefined && requirementSet.sourceRevision !== sourceRevision,
    processingStages,
    requirementSet,
    sourceDocuments,
    startProcessing,
  } as const;
}
