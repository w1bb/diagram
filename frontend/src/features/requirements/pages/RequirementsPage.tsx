import { useEffect, useMemo, useState } from 'react';

import { Spinner } from '../../../components/feedback/Spinner/Spinner';
import { toast } from '../../../components/feedback/Toast/toastStore';
import { FileDropzone } from '../../../components/forms/FileDropzone/FileDropzone';
import { FileDropzoneRaw } from '../../../components/forms/FileDropzoneRaw/FileDropzoneRaw';
import { SearchInput } from '../../../components/forms/SearchInput/SearchInput';
import {
  DownloadIcon,
  ReportIcon,
  TrashIcon,
  UploadIcon,
} from '../../../components/icons/Icons';
import { Modal } from '../../../components/overlay/Modal/Modal';
import { PageHeader } from '../../../components/page/PageHeader/PageHeader';
import { ProjectWorkflowNavigation } from '../../projects/components/ProjectWorkflowNavigation/ProjectWorkflowNavigation';
import type { ProjectSummary } from '../../projects/model/project';
import styles from '../../shared/ProjectWorkspacePage.module.css';
import { RequirementAccordion } from '../components/RequirementAccordion/RequirementAccordion';
import { MarkdownPreviewModal } from '../components/MarkdownPreviewModal/MarkdownPreviewModal';
import { RequirementsProcessingDiagram } from '../components/RequirementsProcessingDiagram/RequirementsProcessingDiagram';
import { getLinkedRequirementByAnchor } from '../data/requirements.fixture';
import {
  useRequirementsWorkspace,
  type RequirementSourceDocument,
} from '../hooks/useRequirementsWorkspace';
import { requirementMatchesSearch } from '../model/requirement';
import type { ConvertedMarkdownDocument } from '../model/requirementProcessing';
import pageStyles from './RequirementsPage.module.css';

const requirementSourceAccept = '.pdf,.doc,.docx,.xls,.xlsx,.md,.markdown,.txt,.json';

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  const units = ['KB', 'MB', 'GB'] as const;
  let value = size / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)} ${units[unitIndex]}`;
}

interface RequirementsPageProps {
  readonly project: ProjectSummary;
}

export function RequirementsPage({ project }: RequirementsPageProps) {
  const [activeMarkdownPreview, setActiveMarkdownPreview] = useState<
    ConvertedMarkdownDocument | undefined
  >();
  const [documentPendingDeletion, setDocumentPendingDeletion] = useState<RequirementSourceDocument | undefined>();
  const [expandedRequirementIds, setExpandedRequirementIds] = useState<ReadonlySet<string>>(() => new Set());
  const [requirementSearch, setRequirementSearch] = useState('');
  const [selectionError, setSelectionError] = useState<string | undefined>();
  const {
    addSourceDocuments,
    canStartProcessing,
    convertedMarkdownDocuments,
    deleteSourceDocument,
    isProcessing,
    isRequirementSetStale,
    requirementSet,
    processingStages,
    sourceDocuments,
    startProcessing,
  } = useRequirementsWorkspace(project.id);
  const isUploading = sourceDocuments.some((document) => document.status === 'uploading');
  const targetRequirementAnchor = useMemo(() => {
    const rawAnchor = window.location.hash.slice(1);

    if (!rawAnchor) {
      return undefined;
    }

    try {
      return decodeURIComponent(rawAnchor);
    } catch {
      return rawAnchor;
    }
  }, [project.id]);
  const linkedRequirement = useMemo(
    () => targetRequirementAnchor
      ? getLinkedRequirementByAnchor(project.id, targetRequirementAnchor)
      : undefined,
    [project.id, targetRequirementAnchor],
  );
  const displayedRequirements = useMemo(() => {
    const currentRequirements = requirementSet?.requirements ?? [];

    if (
      !linkedRequirement
      || currentRequirements.some((requirement) => requirement.id === linkedRequirement.id)
    ) {
      return currentRequirements;
    }

    return [...currentRequirements, linkedRequirement];
  }, [linkedRequirement, requirementSet]);
  const hasDisplayedRequirementSet = displayedRequirements.length > 0;
  const markdownPreviewBySourceId = useMemo(
    () => new Map(
      convertedMarkdownDocuments.map((document) => [document.sourceDocumentId, document]),
    ),
    [convertedMarkdownDocuments],
  );

  useEffect(() => {
    setActiveMarkdownPreview(undefined);
    setDocumentPendingDeletion(undefined);
    setSelectionError(undefined);
  }, [project.id]);

  useEffect(() => {
    if (
      activeMarkdownPreview &&
      !markdownPreviewBySourceId.has(activeMarkdownPreview.sourceDocumentId)
    ) {
      setActiveMarkdownPreview(undefined);
    }
  }, [activeMarkdownPreview, markdownPreviewBySourceId]);

  useEffect(() => {
    setExpandedRequirementIds(new Set());
    setRequirementSearch('');
  }, [project.id, requirementSet?.version]);

  useEffect(() => {
    if (!linkedRequirement || !targetRequirementAnchor) {
      return;
    }

    setRequirementSearch('');
    setExpandedRequirementIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(linkedRequirement.id);
      return nextIds;
    });

    const scrollFrame = window.requestAnimationFrame(() => {
      const target = document.getElementById(targetRequirementAnchor);

      target?.scrollIntoView({ behavior: 'auto', block: 'center' });
      target?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(scrollFrame);
  }, [linkedRequirement, targetRequirementAnchor]);

  const filteredRequirements = useMemo(
    () => displayedRequirements.filter((requirement) =>
      requirementMatchesSearch(requirement, requirementSearch)),
    [displayedRequirements, requirementSearch],
  );

  function uploadFiles(files: readonly File[]) {
    addSourceDocuments(files);
    setSelectionError(undefined);
  }

  function reportRejectedFiles(files: readonly File[]) {
    const fileLabel = files.length === 1 ? 'file is' : 'files are';
    setSelectionError(
      `${files.length} ${fileLabel} not supported. Choose PDF, Word, spreadsheet, Markdown, text, or JSON files.`,
    );
  }

  function enqueueRequirementsProcessing() {
    if (!startProcessing()) {
      return;
    }

    toast.info('Requirements processing enqueued', {
      description: 'The current source documents have been enqueued for internal processing.',
    });
  }

  function confirmSourceDeletion() {
    if (!documentPendingDeletion || isProcessing) {
      return;
    }

    deleteSourceDocument(documentPendingDeletion);
    setDocumentPendingDeletion(undefined);
  }

  function toggleRequirement(requirementId: string) {
    setExpandedRequirementIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(requirementId)) {
        nextIds.delete(requirementId);
      } else {
        nextIds.add(requirementId);
      }

      return nextIds;
    });
  }

  const workspaceStatus = isProcessing
    ? 'Processing requirements'
    : isRequirementSetStale
      ? 'Update required'
      : hasDisplayedRequirementSet
        ? 'Requirement set ready'
        : isUploading
          ? 'Uploading sources'
          : 'Ready for sources';

  return (
    <div className={`${styles.page} ${styles.workflowPage}`}>
      <ProjectWorkflowNavigation currentSection="requirements" project={project} />

      <PageHeader
        aside={<span className={styles.statusBadge}>{workspaceStatus}</span>}
        description="Upload requirement documents, inspect atomized candidates, and publish a deduplicated requirement set."
        eyebrow={`${project.name} / Requirements`}
        title="Requirements workspace"
      />

      <div className={pageStyles.requirementsSections}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={`${styles.kicker} ${pageStyles.stepLabel}`}>Step 1</p>
              <h2>Source documents</h2>
            </div>
            <span className={styles.count}>
              {sourceDocuments.length} {sourceDocuments.length === 1 ? 'file' : 'files'}
            </span>
          </div>
          <p className={styles.cardDescription}>
            Add PDF, Word, spreadsheet, Markdown, text, or JSON sources. Original files and extraction provenance will remain linked.
          </p>
          <div className={pageStyles.sourceControls}>
            {sourceDocuments.length === 0 ? (
              <FileDropzone
                accept={requirementSourceAccept}
                buttonLabel="Browse files"
                description="PDF, Word, spreadsheet, Markdown, text, or JSON. Upload starts immediately and completes after two seconds in this simulation."
                heading="Drop requirement files here"
                multiple
                onFilesRejected={reportRejectedFiles}
                onFilesSelected={uploadFiles}
              />
            ) : (
              <FileDropzoneRaw
                accept={requirementSourceAccept}
                aria-live="polite"
                aria-label="Add requirement source documents"
                className={pageStyles.fileList}
                draggingClassName={pageStyles.fileListDragging}
                multiple
                onFilesRejected={reportRejectedFiles}
                onFilesSelected={uploadFiles}
                role="group"
              >
                {({ isDragging, openFilePicker }) => (
                  <>
                    <div className={pageStyles.fileListHeader}>
                      <div>
                        <strong>Source documents</strong>
                        <span>
                          {isDragging
                            ? 'Drop files to add them.'
                            : 'Completed files can be downloaded, previewed after conversion, or deleted.'}
                        </span>
                      </div>
                      <button
                        className={pageStyles.addFilesButton}
                        onClick={openFilePicker}
                        type="button"
                      >
                        <UploadIcon />
                        Add files
                      </button>
                    </div>
                    <ul className={pageStyles.selectedFiles}>
                      {sourceDocuments.map((document) => {
                        const markdownPreview = markdownPreviewBySourceId.get(document.id);

                        return (
                          <li key={document.id}>
                            <div className={pageStyles.fileMetadata}>
                              <span className={pageStyles.fileName}>{document.file.name}</span>
                              <span className={pageStyles.fileSize}>{formatFileSize(document.file.size)}</span>
                            </div>
                            {document.status === 'uploading' ? (
                              <span className={pageStyles.uploadStatus} role="status">
                                <Spinner decorative size={18} strokeWidth={2.2} />
                                Uploading
                              </span>
                            ) : (
                              <div className={pageStyles.fileActions}>
                                <a
                                  aria-label={`Download ${document.file.name}`}
                                  className={pageStyles.downloadButton}
                                  download={document.file.name}
                                  href={document.downloadUrl}
                                >
                                  <DownloadIcon />
                                  Download
                                </a>
                                {markdownPreview ? (
                                  <button
                                    aria-label={`Preview Markdown for ${document.file.name}`}
                                    className={pageStyles.previewButton}
                                    onClick={() => setActiveMarkdownPreview(markdownPreview)}
                                    type="button"
                                  >
                                    <ReportIcon />
                                    Preview markdown
                                  </button>
                                ) : null}
                                <button
                                  aria-label={`Delete ${document.file.name}`}
                                  className={pageStyles.deleteButton}
                                  disabled={isProcessing}
                                  onClick={() => setDocumentPendingDeletion(document)}
                                  title={isProcessing ? 'Deletion is available after requirements processing completes.' : undefined}
                                  type="button"
                                >
                                  <TrashIcon />
                                  Delete
                                </button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </FileDropzoneRaw>
            )}

            {selectionError ? (
              <p className={pageStyles.selectionError} role="alert">{selectionError}</p>
            ) : null}

            {sourceDocuments.length > 0 ? (
              <div className={pageStyles.processingControls}>
                <button
                  className={pageStyles.processButton}
                  disabled={!canStartProcessing}
                  onClick={enqueueRequirementsProcessing}
                  type="button"
                >
                  {isProcessing ? (
                    <>
                      Processing requirements
                      <Spinner decorative size={18} strokeWidth={2.2} />
                    </>
                  ) : isUploading ? (
                    <>
                      Start requirements processing
                      <Spinner decorative size={18} strokeWidth={2.2} />
                    </>
                  ) : (
                    'Start requirements processing'
                  )}
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={`${styles.kicker} ${pageStyles.stepLabel}`}>Step 2</p>
              <h2>Requirement set</h2>
            </div>
            <span className={styles.count}>
              {hasDisplayedRequirementSet ? `${displayedRequirements.length} detected` : isProcessing ? 'Processing' : 'Not generated'}
            </span>
          </div>
          <p className={styles.cardDescription}>
            Conversion, extraction, atomization, and deduplication converge into a versioned active set.
          </p>

          <RequirementsProcessingDiagram stages={processingStages} />

          {isRequirementSetStale ? (
            <div className={pageStyles.staleNotice} role="status">
              <strong>Requirement set is out of date</strong>
              <span>Source documents changed after this set was generated. Start requirements processing again to refresh it.</span>
            </div>
          ) : null}

          {isProcessing && requirementSet ? (
            <div className={pageStyles.refreshNotice} role="status">
              <Spinner decorative size={18} strokeWidth={2.2} />
              Refreshing the requirement set from the current source documents.
            </div>
          ) : null}

          {hasDisplayedRequirementSet ? (
            <div className={pageStyles.requirementResults}>
              <div className={pageStyles.requirementToolbar}>
                <SearchInput
                  aria-label="Search detected requirements"
                  className={pageStyles.requirementSearch}
                  onChange={(event) => setRequirementSearch(event.target.value)}
                  onClear={() => setRequirementSearch('')}
                  placeholder="Search requirements"
                  value={requirementSearch}
                />
                <span aria-live="polite" className={pageStyles.searchResultCount}>
                  {filteredRequirements.length} of {displayedRequirements.length}
                </span>
              </div>

              {filteredRequirements.length > 0 ? (
                <ol
                  aria-label={requirementSet
                    ? `Requirement set version ${requirementSet.version}`
                    : 'Linked published requirement'}
                  className={pageStyles.requirementList}
                >
                  {filteredRequirements.map((requirement) => (
                    <RequirementAccordion
                      index={displayedRequirements.findIndex((candidate) => candidate.id === requirement.id)}
                      isExpanded={expandedRequirementIds.has(requirement.id)}
                      isTargeted={linkedRequirement?.id === requirement.id}
                      key={requirement.id}
                      onToggle={() => toggleRequirement(requirement.id)}
                      requirement={requirement}
                    />
                  ))}
                </ol>
              ) : (
                <div className={pageStyles.noSearchResults}>
                  <strong>No requirements found</strong>
                  <span>Try a label, type, priority, source, raw statement, or duplicate candidate.</span>
                </div>
              )}
            </div>
          ) : isProcessing ? (
            <div className={pageStyles.processingState} role="status">
              <Spinner decorative size={28} strokeWidth={3} />
              <strong>Processing source documents</strong>
              <span>Converting, extracting, atomizing, and deduplicating detected requirements.</span>
            </div>
          ) : null}
        </section>
      </div>

      <MarkdownPreviewModal
        document={activeMarkdownPreview}
        onClose={() => setActiveMarkdownPreview(undefined)}
      />

      <Modal
        className={pageStyles.deleteModal}
        description={
          documentPendingDeletion
            ? `Remove “${documentPendingDeletion.file.name}” from this project's source documents?`
            : undefined
        }
        footer={
          <>
            <button
              className={pageStyles.modalCancelButton}
              data-autofocus="true"
              onClick={() => setDocumentPendingDeletion(undefined)}
              type="button"
            >
              Cancel
            </button>
            <button
              className={pageStyles.modalDeleteButton}
              disabled={isProcessing}
              onClick={confirmSourceDeletion}
              type="button"
            >
              <TrashIcon />
              Delete file
            </button>
          </>
        }
        icon={<TrashIcon />}
        isOpen={documentPendingDeletion !== undefined}
        onClose={() => setDocumentPendingDeletion(undefined)}
        title="Delete source document?"
      >
        <p className={pageStyles.deleteModalMessage}>
          This action cannot be undone. Any existing requirement set will be marked out of date.
        </p>
      </Modal>
    </div>
  );
}
