import { Editorial, EditorOptions, EditorRef } from '@biblionexus-foundation/platform-editor';
import { Usj, USJ_TYPE, USJ_VERSION } from '@biblionexus-foundation/scripture-utilities';
import { Canon, SerializedVerseRef } from '@sillsdev/scripture';
import { useEffect, useMemo, useRef } from 'react';
import { logger } from '@papi/frontend';
import { useProjectData } from '@papi/frontend/react';
import { getErrorMessage, isPlatformError } from 'platform-bible-utils';
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
  const [usjPossiblyError] = useProjectData('platformScripture.USJ_Chapter', projectId).ChapterUSJ(
    verseRef,
    usjDefault,
  );

  const usj = useMemo(() => {
    if (isPlatformError(usjPossiblyError)) {
      logger.warn(`Error getting project name: ${getErrorMessage(usjPossiblyError)}`);
      return usjDefault;
    }
    return usjPossiblyError;
  }, [usjPossiblyError]);

  useEffect(() => {
    if (usj) editorRef.current.setUsj(usj);
  }, [usj]);

  const textDirectionEffective = useMemo(() => {
    // OHEBGRK is a special case where we want to show the OT in RTL but the NT in LTR
    if (projectInfo?.name === 'OHEBGRK')
      if (Canon.isBookOT(verseRef.book)) return 'rtl';
      else return 'ltr';

    return projectInfo?.textDirection;
  }, [projectInfo, verseRef]);

  const options = useMemo<EditorOptions>(
    () => ({
      isReadonly: true,
      hasSpellCheck: false,
      textDirection: textDirectionEffective,
    }),
    [textDirectionEffective],
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
