import { Editorial, EditorOptions, EditorRef, Usj } from '@biblionexus-foundation/platform-editor';
import { VerseRef } from '@sillsdev/scripture';
import { useEffect, useRef } from 'react';
import { logger } from '@papi/frontend';
import { useProjectData } from '@papi/frontend/react';
import { ProjectInfo } from '../../util';

export type ChapterViewProps = {
  projectId: string;
  projectInfo: ProjectInfo | undefined;
  verseRef: VerseRef;
};

const options: EditorOptions = { isReadonly: true, hasSpellCheck: false };

const usjDocumentDefault: Usj = { type: 'USJ', version: '0.2.1', content: [] };

function ChapterView({ projectId, projectInfo, verseRef }: ChapterViewProps) {
  // This ref becomes defined when passed to the editor. null because React uses null in refs
  // eslint-disable-next-line no-type-assertion/no-type-assertion, no-null/no-null
  const editorRef = useRef<EditorRef>(null!);
  const [usj] = useProjectData('platformScripture.USJ_Chapter', projectId).ChapterUSJ(
    verseRef,
    usjDocumentDefault,
  );

  useEffect(() => {
    editorRef.current.setUsj(usj);
  }, [usj]);

  return (
    <div className="full-chapter-view">
      <div className="position-title">
        <p>{projectInfo?.name || '...'}</p>
      </div>
      <Editorial ref={editorRef} scrRef={verseRef} options={options} logger={logger} />
    </div>
  );
}

export default ChapterView;
