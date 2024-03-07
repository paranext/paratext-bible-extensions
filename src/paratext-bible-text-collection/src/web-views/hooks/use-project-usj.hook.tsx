import { VerseRef } from '@sillsdev/scripture';
import { useProjectData } from '@papi/frontend/react';
import { useEffect, useState } from 'react';
import { Usj, usxStringToJson } from '@biblionexus-foundation/platform-editor';
import { logger } from '@papi/frontend';

export default function useProjectUsj(
  projectId: string,
  verseRef: VerseRef,
): [Usj, (usj: Usj) => void] {
  const [usx] = useProjectData('ParatextStandard', projectId).ChapterUSX(verseRef, '');

  const [usj, setUsj] = useState<Usj>();
  useEffect(() => {
    if (usx) {
      try {
        setUsj(usxStringToJson(usx));
      } catch (e) {
        logger.warn(`Usj convert error: ${e}`);
      }
    }
  }, [usx]);

  return [usj, setUsj];
}
