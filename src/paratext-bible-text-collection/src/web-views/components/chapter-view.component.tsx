import { useProjectData } from '@papi/frontend/react';
import { VerseRef } from '@sillsdev/scripture';
import { ProjectMetadata } from '@papi/core';
import { useEffect, useState } from 'react';
import { logger } from '@papi/frontend';
import { Editor, Usj, usxStringToJson } from '@biblionexus-foundation/platform-editor';

export type ChapterViewProps = {
  projectId: string;
  projectMetadata: ProjectMetadata | undefined;
  verseRef: VerseRef;
};

function ChapterView({ projectId, projectMetadata, verseRef }: ChapterViewProps) {
  const [usx] = useProjectData('ParatextStandard', projectId).ChapterUSX(verseRef, '');

  const [usj, setUsj] = useState<Usj>();
  useEffect(() => {
    if (usx) {
      try {
        setUsj(usxStringToJson(usx));
      } catch (e) {
        logger.warn(`ResourceViewer convert error: ${e}`);
      }
    }
  }, [usx]);
  return (
    <div className="full-chapter-view">
      <div className="position-title">
        <p>{projectMetadata?.name || '...'}</p>
      </div>
      <p className="position-text">
        <Editor usj={usj} scrRef={verseRef} logger={logger} isReadonly />
      </p>
    </div>
  );
}

export default ChapterView;
