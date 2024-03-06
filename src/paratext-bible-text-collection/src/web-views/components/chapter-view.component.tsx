import { VerseRef } from '@sillsdev/scripture';
import { ProjectMetadata } from '@papi/core';
import { logger } from '@papi/frontend';
import { Editor } from '@biblionexus-foundation/platform-editor';
import useProjectUsj from '../hooks/use-project-usj.hook';

export type ChapterViewProps = {
  projectId: string;
  projectMetadata: ProjectMetadata | undefined;
  verseRef: VerseRef;
};

function ChapterView({ projectId, projectMetadata, verseRef }: ChapterViewProps) {
  const [usj] = useProjectUsj(projectId, verseRef);

  return (
    <div className="full-chapter-view">
      <div className="position-title">
        <p>{projectMetadata?.name || '...'}</p>
      </div>
      <Editor usj={usj} scrRef={verseRef} logger={logger} isReadonly />
    </div>
  );
}

export default ChapterView;
