import { VerseRef } from '@sillsdev/scripture';
import type { ProjectMetadata } from 'shared/models/project-metadata.model';

export function getTextCollectionTitle(
  projectsMetadata: (ProjectMetadata | undefined)[],
  verseRef: VerseRef,
) {
  if (!projectsMetadata || projectsMetadata.includes(undefined) || !verseRef) return undefined;

  // Type assert projectsMetadata as not containing undefined since we just checked for that
  return `${(projectsMetadata as ProjectMetadata[])
    .map((projectMetadata) => projectMetadata.name)
    .join(', ')} (${verseRef.toString()})`;
}

export function getTextCollectionTooltip(projectsMetadata: (ProjectMetadata | undefined)[]) {
  if (!projectsMetadata || projectsMetadata.includes(undefined)) return undefined;

  // Type assert projectsMetadata as not containing undefined since we just checked for that
  return `Text Collection\n\n${(projectsMetadata as ProjectMetadata[])
    .map((projectMetadata) => projectMetadata.name)
    .join('\n')}`;
}
