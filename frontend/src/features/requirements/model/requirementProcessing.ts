export type RequirementProcessingStageId =
  | 'convert'
  | 'extract'
  | 'atomize'
  | 'deduplicate';

export type RequirementProcessingStatus =
  | 'not-started'
  | 'in-progress'
  | 'completed'
  | 'failed';

export interface RequirementProcessingStage {
  readonly description: string;
  readonly id: RequirementProcessingStageId;
  readonly label: string;
  readonly status: RequirementProcessingStatus;
}

export interface ConvertedMarkdownDocument {
  readonly content: string;
  readonly downloadUrl: string;
  readonly filename: string;
  readonly sourceDocumentId: string;
  readonly sourceFilename: string;
}

export const requirementProcessingStageDefinitions: readonly Omit<
  RequirementProcessingStage,
  'status'
>[] = [
  {
    id: 'convert',
    label: 'Convert to Markdown',
    description: 'Convert every source document into a normalized Markdown artifact.',
  },
  {
    id: 'extract',
    label: 'Extract requirements',
    description: 'Identify requirement statements in every converted Markdown file.',
  },
  {
    id: 'atomize',
    label: 'Split into atomic requirements',
    description: 'Separate compound statements into independently verifiable requirements.',
  },
  {
    id: 'deduplicate',
    label: 'Deduplicate and merge',
    description: 'Resolve overlapping candidates and publish the final requirement set.',
  },
];

export const requirementProcessingStatusLabels: Readonly<
  Record<RequirementProcessingStatus, string>
> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  completed: 'Completed',
  failed: 'Failed',
};

export function createInitialProcessingStages(): readonly RequirementProcessingStage[] {
  return requirementProcessingStageDefinitions.map((stage) => ({
    ...stage,
    status: 'not-started',
  }));
}
