import { Editorial, EditorOptions, EditorRef } from '@biblionexus-foundation/platform-editor';
import { Usj, USJ_TYPE, USJ_VERSION } from '@biblionexus-foundation/scripture-utilities';
import { Canon, SerializedVerseRef } from '@sillsdev/scripture';
import { useEffect, useMemo, useRef } from 'react';
import { logger } from '@papi/frontend';
import { useProjectData } from '@papi/frontend/react';
import { ProjectInfo } from '../../util';

export type ChapterViewProps = {
  projectId: string;
  projectInfo: ProjectInfo | undefined;
  verseRef: SerializedVerseRef;
};

const usjDefault: Usj = { type: USJ_TYPE, version: USJ_VERSION, content: [] };

export default function ChapterView({ projectId, projectInfo, verseRef }: ChapterViewProps) {
  // This ref becomes defined when passed to the editor. null because React uses null in refs
  // eslint-disable-next-line no-type-assertion/no-type-assertion, no-null/no-null
  const editorRef = useRef<EditorRef>(null!);
  const [usj] = useProjectData('platformScripture.USJ_Chapter', projectId).ChapterUSJ(
    verseRef,
    usjDefault,
  );

  useEffect(() => {
    if (usj) editorRef.current.setUsj(usj);
  }, [usj]);

  const options = useMemo<EditorOptions>(
    () => ({
      isReadonly: true,
      hasSpellCheck: false,
      textDirection:
        projectInfo?.name === 'OHEBGRK' && Canon.isBookOT(verseRef.book) ? 'rtl' : 'ltr',
    }),
    [projectInfo, verseRef],
  );

  return (
    <div className="full-chapter-view">
      <div className="position-title">
        <p>{projectInfo?.name ?? '...'}</p>
      </div>
      <Editorial ref={editorRef} scrRef={verseRef} options={options} logger={logger} />
    </div>
  );
}
