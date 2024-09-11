import { UseWebViewStateHook } from '@papi/core';
import { useProjectData } from '@papi/frontend/react';
import { VerseRef } from '@sillsdev/scripture';

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
  const [usfm] = useProjectData('platformScripture.USFM_Verse', projectId).VerseUSFM(
    verseRef,
    'Loading',
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
        <div className="title">{projectInfo?.name || '...'}</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">&#x22ee;</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleCloseProject}>
              <HighlightOff /> Close Text
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={(event) => {
                handleZoom(event, fontSize + 1);
              }}
            >
              <ZoomIn /> Zoom in
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(event) => {
                handleZoom(event, fontSize - 1);
              }}
            >
              <ZoomOut /> Zoom out
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(event) => {
                handleZoom(event, defaultFontSize);
              }}
              disabled={fontSize === defaultFontSize}
            >
              <RestartAlt /> Zoom Reset
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={(event) => {
                handleProjectUpDown(event, true);
              }}
              disabled={isFirstProject}
            >
              <VerticalAlignTop /> Move Up
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(event) => {
                handleProjectUpDown(event, false);
              }}
              disabled={isLastProject}
            >
              <VerticalAlignBottom /> Move Down
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="text" style={{ fontSize }}>
        {usfm}
      </p>
    </div>
  );
}

export default VerseDisplay;
