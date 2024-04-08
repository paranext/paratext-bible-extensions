import { VerseRef } from '@sillsdev/scripture';
import { useProjectData } from '@papi/frontend/react';
import { useEffect, useState } from 'react';
import { Usj, usxStringToUsj } from '@biblionexus-foundation/platform-editor';

export default function useProjectUsj(
  projectId: string,
  verseRef: VerseRef,
): [Usj, (usj: Usj) => void] {
  const [usx] = useProjectData('ParatextStandard', projectId).ChapterUSX(verseRef, '');
  const [usj, setUsj] = useState<Usj>();

  useEffect(() => {
    if (usx) setUsj(usxStringToUsj(usx));
  }, [usx]);

  return [usj, setUsj];
}
