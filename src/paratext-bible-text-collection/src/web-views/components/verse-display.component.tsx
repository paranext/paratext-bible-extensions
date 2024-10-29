import { useLocalizedStrings, useProjectData } from '@papi/frontend/react';
import { UseWebViewStateHook } from '@papi/core';
import { Canon, VerseRef } from '@sillsdev/scripture';

import {
  HighlightOff,
  RestartAlt,
  VerticalAlignBottom,
  VerticalAlignTop,
  ZoomIn,
  ZoomOut,
} from '@mui/icons-material';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'platform-bible-react';
import { MouseEvent } from 'react';
import { ProjectInfo } from '../../util';

const defaultFontSize: number = 16;

export type VerseDisplayProps = {
  projectId: string;
  projectInfo: ProjectInfo | undefined;
  selectedProjectId: string;
  selectProjectId: (projectId: string) => void;
  verseRef: VerseRef;
  isFirstProject: boolean;
  isLastProject: boolean;
  onMoveUpDown: (directionUp: boolean, projectId: string) => void;
  onCloseProject: (projectId: string) => void;
  isSelected: boolean;
  useWebViewState: UseWebViewStateHook;
};

function VerseDisplay({
  projectId,
  projectInfo,
  selectedProjectId,
  selectProjectId,
  verseRef,
  isFirstProject,
  isLastProject,
  onMoveUpDown,
  onCloseProject,
  isSelected,
  useWebViewState,
}: VerseDisplayProps) {
  const [versePlainText] = useProjectData(
    'platformScripture.PlainText_Verse',
    projectId,
  ).VersePlainText(verseRef, '');
  const loadingKey = '%textCollection_verseDisplay_loading%';
  const ellipsisKey = '%textCollection_verseDisplay_projectNameMissing%';
  const moreActionsKey = '%textCollection_verseDisplay_openMenu_tooltips%';
  const closeTextKey = '%textCollection_verseDisplay_closeText%';
  const zoomInKey = '%textCollection_verseDisplay_zoomIn%';
  const zoomOutKey = '%textCollection_verseDisplay_zoomOut%';
  const zoomResetKey = '%textCollection_verseDisplay_zoomReset%';
  const moveUpKey = '%textCollection_verseDisplay_moveTextUp%';
  const moveDownKey = '%textCollection_verseDisplay_moveTextDown%';
  const [localizedStrings] = useLocalizedStrings([
    loadingKey,
    ellipsisKey,
    moreActionsKey,
    closeTextKey,
    zoomInKey,
    zoomOutKey,
    zoomResetKey,
    moveUpKey,
    moveDownKey,
  ]);
  const localizedLoading = localizedStrings[loadingKey];
  const localizedEllipsis = localizedStrings[ellipsisKey];
  const localizedMoreActions = localizedStrings[moreActionsKey];
  const localizedCloseText = localizedStrings[closeTextKey];
  const localizedZoomIn = localizedStrings[zoomInKey];
  const localizedZoomOut = localizedStrings[zoomOutKey];
  const localizedZoomReset = localizedStrings[zoomResetKey];
  const localizedMoveUp = localizedStrings[moveUpKey];
  const localizedMoveDown = localizedStrings[moveDownKey];

  const [usfm] = useProjectData('platformScripture.USFM_Verse', projectId).VerseUSFM(
    verseRef,
    localizedLoading,
  );
  const [fontSize, setFontSize] = useWebViewState<number>(`fontSize_${projectId}`, defaultFontSize);

  const handleCloseProject = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    onCloseProject(projectId);
  };

  const handleZoom = (event: MouseEvent<HTMLElement>, newFontSize: number) => {
    event.stopPropagation();
    setFontSize(newFontSize);
  };
  const handleProjectUpDown = (event: MouseEvent<HTMLElement>, isDirectionUp: boolean) => {
    event.stopPropagation();
    onMoveUpDown(isDirectionUp, projectId);
  };

  const handleDivClick = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    selectProjectId(selectedProjectId !== projectId || selectedProjectId === '' ? projectId : '');
  };

  return (
    <div
      onClick={handleDivClick}
      className={`verse-content${isSelected ? ' selected' : ''}`}
      aria-hidden="true"
    >
      <div className="row">
        <div className="title">{projectInfo?.name || localizedEllipsis}</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">&#x22ee;</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleCloseProject}>
              <HighlightOff /> {localizedCloseText}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={(event) => {
                handleZoom(event, fontSize + 1);
              }}
            >
              <ZoomIn /> {localizedZoomIn}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(event) => {
                handleZoom(event, fontSize - 1);
              }}
            >
              <ZoomOut /> {localizedZoomOut}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(event) => {
                handleZoom(event, defaultFontSize);
              }}
              disabled={fontSize === defaultFontSize}
            >
              <RestartAlt /> {localizedZoomReset}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={(event) => {
                handleProjectUpDown(event, true);
              }}
              disabled={isFirstProject}
            >
              <VerticalAlignTop /> {localizedMoveUp}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(event) => {
                handleProjectUpDown(event, false);
              }}
              disabled={isLastProject}
            >
              <VerticalAlignBottom /> {localizedMoveDown}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p
        dir={
          projectInfo?.name === 'OHEBGRK' && Canon.isBookOT(verseRef.bookNum) ? 'rtl' : undefined
        }
        className="text"
        style={{ fontSize }}
      >
        {versePlainText}
      </p>
    </div>
  );
}

export default VerseDisplay;
