function markdownFilename(sourceFilename: string): string {
  const finalDotIndex = sourceFilename.lastIndexOf('.');
  const baseName = (finalDotIndex > 0 ? sourceFilename.slice(0, finalDotIndex) : sourceFilename)
    .replace(/[\u0000-\u001f<>:"/\\|?*]+/g, '-')
    .trim();

  return `${baseName || 'converted-requirements'}.md`;
}

function formatFileSize(size: number): string {
  return new Intl.NumberFormat(undefined).format(size);
}

export interface MockMarkdownPreview {
  readonly content: string;
  readonly filename: string;
}

export function createMockMarkdownPreview(file: File): MockMarkdownPreview {
  const content = `# Converted requirement source

> Mock Markdown conversion preview generated in the browser. The source file was not parsed and this artifact is not persisted.

## Source document

    Original filename: ${JSON.stringify(file.name)}
    Media type: ${JSON.stringify(file.type || 'Not provided')}
    Original size: ${formatFileSize(file.size)} bytes

## Converted content

This preview represents the Markdown artifact that the requirement-extraction stage would receive from the backend conversion worker.

### Candidate requirement statements

- Preserve every detected requirement's source document and locator.
- Split compound statements into independently verifiable requirements.
- Merge semantic duplicates without losing candidate lineage.
`;

  return {
    content,
    filename: markdownFilename(file.name),
  };
}
