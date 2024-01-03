import { useProjectData } from '@papi/frontend/react';
import { VerseRef } from '@sillsdev/scripture';
import { ProjectMetadata } from '@papi/core';

export type ChapterViewProps = {
  projectId: string;
  projectMetadata: ProjectMetadata | undefined;
  verseRef: VerseRef;
};

function ChapterView({ projectId, projectMetadata, verseRef }: ChapterViewProps) {
  const [usfm] = useProjectData('ParatextStandard', projectId).ChapterUSFM(verseRef, 'Loading');
  return (
    <div className="full-chapter-view">
      <div className="position-title">
        <p>{projectMetadata?.name || '...'}</p>
      </div>
      <p className="position-text">{usfm}</p>
    </div>
  );
}

export default ChapterView;
