import { Editor, EditorRef } from '@biblionexus-foundation/platform-editor';
import { VerseRef } from '@sillsdev/scripture';
import { useEffect, useRef } from 'react';
import { ProjectMetadata } from '@papi/core';
import { logger } from '@papi/frontend';
import useProjectUsj from '../hooks/use-project-usj.hook';

export type ChapterViewProps = {
  projectId: string;
  projectMetadata: ProjectMetadata | undefined;
  verseRef: VerseRef;
};

function ChapterView({ projectId, projectMetadata, verseRef }: ChapterViewProps) {
  const editorRef = useRef<EditorRef>(null!);
  const [usj] = useProjectUsj(projectId, verseRef);

  useEffect(() => {
    editorRef.current.setUsj(usj);
  }, [usj]);

  return (
    <div className="full-chapter-view">
      <div className="position-title">
        <p>{projectMetadata?.name || '...'}</p>
      </div>
      <Editor ref={editorRef} scrRef={verseRef} logger={logger} isReadonly />
    </div>
  );
}

export default ChapterView;
