import { useEffect, useId, useRef, useState } from 'react';

import { CaretIcon } from '../../../components/icons/Icons';
import { PageHeader } from '../../../components/page/PageHeader/PageHeader';
import { Spinner } from '../../../components/feedback/Spinner/Spinner';
import { toast } from '../../../components/feedback/Toast/toastStore';
import { ProjectWorkflowNavigation } from '../../projects/components/ProjectWorkflowNavigation/ProjectWorkflowNavigation';
import type { ProjectSummary } from '../../projects/model/project';
import workspaceStyles from '../../shared/ProjectWorkspacePage.module.css';
import { EditFindingModal } from '../components/EditFindingModal/EditFindingModal';
import { ExportMenu } from '../components/ExportMenu/ExportMenu';
import { FindingsTable } from '../components/FindingsTable/FindingsTable';
import { ReportCharts } from '../components/ReportCharts/ReportCharts';
import { SolutionModal } from '../components/SolutionModal/SolutionModal';
import { getReportsForProject } from '../data/reports.fixture';
import type { ReportExportFormat, ReportFinding, ReportStatus } from '../model/report';
import {
  createMockExport,
  createProposedSolution,
  downloadMarkdown,
} from '../utils/reportDownloads';
import styles from './ReportPage.module.css';

interface ReportPageProps {
  readonly project: ProjectSummary;
}

const EXPORT_DELAY = 4_000;
const SOLUTION_DELAY = 2_000;

const reportStatusLabels: Readonly<Record<ReportStatus, string>> = {
  draft: 'Draft report',
  final: 'Final report',
  archived: 'Archived report',
};

const reportStatusClassNames: Readonly<Record<ReportStatus, string | undefined>> = {
  draft: styles.statusDraft,
  final: styles.statusFinal,
  archived: styles.statusArchived,
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatExportName(format: ReportExportFormat): string {
  if (format === 'markdown') {
    return 'Markdown';
  }

  return format.toUpperCase();
}

function percentage(value: number, total: number): number {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

export function ReportPage({ project }: ReportPageProps) {
  const reportSelectId = useId();
  const reports = getReportsForProject(project.id);
  const exportTimersRef = useRef<Set<number>>(new Set());
  const requestedExportsRef = useRef<Set<string>>(new Set());
  const solutionTimerRef = useRef<number | undefined>(undefined);
  const [selectedReportId, setSelectedReportId] = useState<string>();
  const [findingOverrides, setFindingOverrides] = useState<
    Readonly<Record<string, readonly ReportFinding[]>>
  >({});
  const [editingFindingId, setEditingFindingId] = useState<string>();
  const [selectedFindingIds, setSelectedFindingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [isCreatingSolution, setIsCreatingSolution] = useState(false);
  const [isSolutionModalOpen, setIsSolutionModalOpen] = useState(false);
  const [solutionContent, setSolutionContent] = useState('');
  const baseSelectedReport = reports.find((report) => report.id === selectedReportId) ?? reports[0];
  const selectedReport = baseSelectedReport
    ? {
        ...baseSelectedReport,
        findings: findingOverrides[baseSelectedReport.id] ?? baseSelectedReport.findings,
      }
    : undefined;
  const editingFinding = selectedReport?.findings.find(
    (finding) => finding.id === editingFindingId,
  );

  useEffect(() => {
    if (solutionTimerRef.current !== undefined) {
      window.clearTimeout(solutionTimerRef.current);
      solutionTimerRef.current = undefined;
    }

    setSelectedFindingIds(new Set());
    setEditingFindingId(undefined);
    setIsCreatingSolution(false);
    setIsSolutionModalOpen(false);
    setSolutionContent('');

    return () => {
      if (solutionTimerRef.current !== undefined) {
        window.clearTimeout(solutionTimerRef.current);
        solutionTimerRef.current = undefined;
      }
    };
  }, [selectedReport?.id]);

  useEffect(() => () => {
    exportTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    exportTimersRef.current.clear();
    requestedExportsRef.current.clear();
  }, [project.id]);

  function selectExportFormat(format: ReportExportFormat) {
    if (!selectedReport) {
      return;
    }

    const report = selectedReport;
    const exportKey = `${report.id}:${format}`;

    if (requestedExportsRef.current.has(exportKey)) {
      return;
    }

    requestedExportsRef.current.add(exportKey);
    const formatName = formatExportName(format);
    toast.info(`${formatName} export queued`, {
      description: `${report.title} will be processed shortly.`,
    });

    const exportTimer = window.setTimeout(() => {
      exportTimersRef.current.delete(exportTimer);
      toast.success(`${formatName} export complete`, {
        description: 'Your mocked Markdown download is starting.',
      });
      downloadMarkdown(createMockExport(report, format), `${report.title}-${format}-export`);
    }, EXPORT_DELAY);

    exportTimersRef.current.add(exportTimer);
  }

  function setFindingSelected(findingId: string, selected: boolean) {
    if (isCreatingSolution) {
      return;
    }

    setSelectedFindingIds((currentSelection) => {
      const nextSelection = new Set(currentSelection);

      if (selected) {
        nextSelection.add(findingId);
      } else {
        nextSelection.delete(findingId);
      }

      return nextSelection;
    });
  }

  function replaceFinding(updatedFinding: ReportFinding) {
    if (!selectedReport) {
      return;
    }

    const reportId = selectedReport.id;
    const visibleFindings = selectedReport.findings;

    setFindingOverrides((currentOverrides) => {
      const currentFindings = currentOverrides[reportId] ?? visibleFindings;

      return {
        ...currentOverrides,
        [reportId]: currentFindings.map((finding) =>
          finding.id === updatedFinding.id ? updatedFinding : finding),
      };
    });
  }

  function editFinding(finding: ReportFinding) {
    if (isCreatingSolution) {
      return;
    }

    setEditingFindingId(finding.id);
  }

  function saveFinding(finding: ReportFinding) {
    replaceFinding(finding);
    setEditingFindingId(undefined);
    toast.success('Finding updated', {
      description: `${finding.requirementReference} was updated for this browser session.`,
    });
  }

  function discardFinding(finding: ReportFinding) {
    if (isCreatingSolution || finding.status === 'dismissed') {
      return;
    }

    replaceFinding({ ...finding, status: 'dismissed' });
    setSelectedFindingIds((currentSelection) => {
      const nextSelection = new Set(currentSelection);
      nextSelection.delete(finding.id);
      return nextSelection;
    });
    toast.warning('Finding discarded', {
      description: `${finding.requirementReference} remains visible with a dismissed status.`,
    });
  }

  function proposeSolution() {
    if (!selectedReport || selectedFindingIds.size === 0 || isCreatingSolution) {
      return;
    }

    const report = selectedReport;
    const selectedFindings = report.findings.filter((finding) =>
      selectedFindingIds.has(finding.id),
    );

    setIsCreatingSolution(true);
    solutionTimerRef.current = window.setTimeout(() => {
      solutionTimerRef.current = undefined;
      setSolutionContent(createProposedSolution(report, selectedFindings));
      setIsCreatingSolution(false);
      setIsSolutionModalOpen(true);
    }, SOLUTION_DELAY);
  }

  function downloadSolution() {
    if (!selectedReport || solutionContent.trim().length === 0) {
      return;
    }

    downloadMarkdown(solutionContent, `${selectedReport.title}-proposed-solution`);
  }

  const openFindings = selectedReport?.findings.filter((finding) => finding.status === 'open').length ?? 0;
  const acceptedFindings = selectedReport?.findings.filter((finding) => finding.status === 'accepted').length ?? 0;
  const requirementCoverage = selectedReport
    ? percentage(
        selectedReport.summary.requirementsVerified,
        selectedReport.summary.requirementsTotal,
      )
    : 0;

  return (
    <div className={workspaceStyles.page}>
      <ProjectWorkflowNavigation currentSection="report" project={project} />

      <PageHeader
        aside={selectedReport ? (
          <span className={`${styles.reportStatus} ${reportStatusClassNames[selectedReport.status] ?? ''}`}>
            {reportStatusLabels[selectedReport.status]}
          </span>
        ) : <span className={styles.reportStatus}>No reports</span>}
        description="Review requirement, implementation, and test gaps with evidence and proposed solutions."
        eyebrow={`${project.name} / Report`}
        title="Verification reports"
      />

      <section aria-label="Report controls" className={styles.toolbar}>
        <div className={styles.selectionArea}>
          <label className={styles.selectLabel} htmlFor={reportSelectId}>
            Viewing report
          </label>
          <div className={styles.selectShell}>
            <select
              disabled={reports.length === 0}
              id={reportSelectId}
              onChange={(event) => setSelectedReportId(event.currentTarget.value)}
              value={selectedReport?.id ?? ''}
            >
              {reports.length === 0 ? <option value="">No reports available</option> : null}
              {reports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.title} · {formatDate(report.updatedAt)}
                </option>
              ))}
            </select>
            <CaretIcon aria-hidden="true" />
          </div>
          {selectedReport ? (
            <div className={styles.reportContext}>
              <p>{selectedReport.description}</p>
              <span>Updated {formatDate(selectedReport.updatedAt)}</span>
              <span>{selectedReport.summary.filesAnalyzed} files analyzed</span>
            </div>
          ) : (
            <p className={styles.noReportContext}>Generate a validation report to review findings and exports.</p>
          )}
        </div>
        <ExportMenu disabled={!selectedReport} onSelect={selectExportFormat} />
      </section>

      {selectedReport ? (
        <>
          <section aria-label="Key report metrics" className={styles.metrics}>
            <article>
              <span>Requirements verified</span>
              <strong>{selectedReport.summary.requirementsVerified}/{selectedReport.summary.requirementsTotal}</strong>
              <small>{requirementCoverage}% traceable coverage</small>
            </article>
            <article>
              <span>Open findings</span>
              <strong>{openFindings}</strong>
              <small>{acceptedFindings} accepted for follow-up</small>
            </article>
            <article>
              <span>Implementation coverage</span>
              <strong>{selectedReport.summary.implementationCoverage}%</strong>
              <small>Requirement evidence found</small>
            </article>
            <article>
              <span>Test coverage</span>
              <strong>{selectedReport.summary.testCoverage}%</strong>
              <small>Requirements with test evidence</small>
            </article>
          </section>

          <ReportCharts report={selectedReport} />
          <FindingsTable
            disabled={isCreatingSolution}
            onDiscard={discardFinding}
            onEdit={editFinding}
            onSelectionChange={setFindingSelected}
            report={selectedReport}
            selectedFindingIds={selectedFindingIds}
          />
        </>
      ) : (
        <section className={`${workspaceStyles.card} ${workspaceStyles.wideCard}`}>
          <div className={workspaceStyles.emptyState}>
            <strong>No report has been generated</strong>
            <span>Publish requirements and ingest a code snapshot before starting validation.</span>
          </div>
        </section>
      )}

      {selectedFindingIds.size > 0 ? (
        <div className={styles.solutionActionDock}>
          <button
            className={styles.solutionAction}
            disabled={isCreatingSolution}
            onClick={proposeSolution}
            type="button"
          >
            {isCreatingSolution ? <Spinner decorative size={18} strokeWidth={2} /> : null}
            <span aria-live="polite">
              {isCreatingSolution ? 'Creating solution...' : 'Propose solution'}
            </span>
          </button>
        </div>
      ) : null}

      <SolutionModal
        content={solutionContent}
        isOpen={isSolutionModalOpen}
        onChange={setSolutionContent}
        onClose={() => setIsSolutionModalOpen(false)}
        onDownload={downloadSolution}
      />

      <EditFindingModal
        finding={editingFinding}
        isOpen={editingFinding !== undefined}
        onClose={() => setEditingFindingId(undefined)}
        onSave={saveFinding}
      />
    </div>
  );
}
