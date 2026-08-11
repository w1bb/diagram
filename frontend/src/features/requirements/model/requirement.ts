export type RequirementPriority = 'critical' | 'high' | 'medium' | 'low' | 'unspecified';

export type RequirementType =
  | 'business'
  | 'functional'
  | 'non_functional'
  | 'code_quality'
  | 'compliance'
  | 'security'
  | 'testing'
  | 'architecture'
  | 'performance'
  | 'other';

export interface NearDuplicateRequirement {
  readonly label: string;
  readonly reasoning: string;
  readonly similarityScore: number;
}

export interface RequirementSourceEvidence {
  readonly filename: string;
  readonly locator: string;
}

export interface DetectedRequirement {
  readonly description: string;
  readonly id: string;
  readonly label: string;
  readonly nearDuplicates: readonly NearDuplicateRequirement[];
  readonly priority: RequirementPriority;
  readonly rawContent: string;
  readonly source: RequirementSourceEvidence;
  readonly type: RequirementType;
}

export const requirementPriorityLabels: Readonly<Record<RequirementPriority, string>> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  unspecified: 'Unspecified',
};

export const requirementTypeLabels: Readonly<Record<RequirementType, string>> = {
  business: 'Business',
  functional: 'Functional',
  non_functional: 'Non-functional',
  code_quality: 'Code quality',
  compliance: 'Compliance',
  security: 'Security',
  testing: 'Testing',
  architecture: 'Architecture',
  performance: 'Performance',
  other: 'Other',
};

export function requirementMatchesSearch(
  requirement: DetectedRequirement,
  searchValue: string,
): boolean {
  const query = searchValue.trim().toLocaleLowerCase();

  if (!query) {
    return true;
  }

  const searchableContent = [
    requirement.label,
    requirement.description,
    requirement.priority,
    requirementPriorityLabels[requirement.priority],
    requirement.type,
    requirementTypeLabels[requirement.type],
    requirement.source.filename,
    requirement.source.locator,
    requirement.rawContent,
    ...requirement.nearDuplicates.flatMap((duplicate) => [
      duplicate.label,
      duplicate.reasoning,
    ]),
  ];

  return searchableContent.some((value) => value.toLocaleLowerCase().includes(query));
}
