import { Editorial, EditorOptions, EditorRef } from '@biblionexus-foundation/platform-editor';
import { Usj } from '@biblionexus-foundation/scripture-utilities';
import { Canon, VerseRef } from '@sillsdev/scripture';
import { useEffect, useMemo, useRef } from 'react';
import { logger } from '@papi/frontend';
import { useProjectData } from '@papi/frontend/react';
import { ProjectInfo } from '../../util';

export type ChapterViewProps = {
  projectId: string;
  projectInfo: ProjectInfo | undefined;
  verseRef: VerseRef;
};

const usjDocumentDefault: Usj = { type: 'USJ', version: '0.2.1', content: [] };

export default function ChapterView({ projectId, projectInfo, verseRef }: ChapterViewProps) {
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

  const options = useMemo<EditorOptions>(
    () => ({
      isReadonly: true,
      hasSpellCheck: false,
      textDirection:
        projectInfo?.name === 'OHEBGRK' && Canon.isBookOT(verseRef.bookNum) ? 'rtl' : 'ltr',
    }),
    [projectInfo, verseRef],
  );

  return (
    <div className="full-chapter-view">
      <div className="position-title">
        <p>{projectInfo?.name || '...'}</p>
      </div>
      <Editorial ref={editorRef} scrRef={verseRef} options={options} logger={logger} />
    </div>
  );
}
