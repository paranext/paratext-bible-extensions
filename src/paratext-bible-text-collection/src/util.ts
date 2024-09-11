import { VerseRef } from '@sillsdev/scripture';
import type { ProjectInterfaces } from 'papi-shared-types';

export type ProjectInfo = { id: string; name: string };

/**
 * `projectInterface`s the text collection uses. All projects the text collection uses must support
 * these
 */
export const REQUIRED_PROJECT_INTERFACES: ProjectInterfaces[] = [
  'platformScripture.PlainText_Verse',
  'platformScripture.USJ_Chapter',
];

export function getTextCollectionTitle(
  projectNames: (string | undefined)[] | undefined,
  verseRef: VerseRef,
) {
  if (!projectNames || projectNames.length === 0 || projectNames.includes(undefined) || !verseRef)
    return undefined;

  return `${projectNames.join(', ')} (${verseRef.toString()})`;
}

export function getTextCollectionTooltip(projectNames: (string | undefined)[] | undefined) {
  if (!projectNames || projectNames.length === 0 || projectNames.includes(undefined))
    return undefined;

  return `Text Collection\n\n${projectNames.join('\n')}`;
}
