import { useProjectData } from '@papi/frontend/react';
import { VerseRef } from '@sillsdev/scripture';
import { ProjectMetadata, UseWebViewStateHook } from '@papi/core';

import { Tooltip, IconButton, Menu, MenuItem, Divider } from '@mui/material';
import {
  HighlightOff,
  RestartAlt,
  ZoomIn,
  ZoomOut,
  VerticalAlignTop,
  VerticalAlignBottom,
} from '@mui/icons-material';
import { useState, MouseEvent } from 'react';

const defaultFontSize: number = 16;

export type VerseDisplayProps = {
  projectId: string;
  projectMetadata: ProjectMetadata | undefined;
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
  projectMetadata,
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
  const [usfm] = useProjectData('ParatextStandard', projectId).VerseUSFM(verseRef, 'Loading');
  const [fontSize, setFontSize] = useWebViewState<number>(`fontSize_${projectId}`, defaultFontSize);
  const [anchorEl, setAnchorEl] = useState<undefined | HTMLElement>(undefined);

  const handleOpenMenu = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const isOpen = !!anchorEl;
  const handleCloseMenu = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(undefined);
  };
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
      className={`verse${isSelected ? ' selected' : ''}`}
      aria-hidden="true"
    >
      <div className="row">
        <div className="title">{projectMetadata?.name || '...'}</div>
        <div>
          <Tooltip title="More Actions">
            <IconButton onClick={handleOpenMenu} size="small" sx={{ ml: 2 }}>
              ...
            </IconButton>
          </Tooltip>
          <Menu
            className="context-menu"
            anchorEl={anchorEl}
            open={isOpen}
            onClose={handleCloseMenu}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleCloseProject}>
              <HighlightOff /> Close Text
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={(event) => {
                handleZoom(event, fontSize + 1);
              }}
            >
              <ZoomIn /> Zoom in
            </MenuItem>
            <MenuItem
              onClick={(event) => {
                handleZoom(event, fontSize - 1);
              }}
            >
              <ZoomOut /> Zoom out
            </MenuItem>
            <MenuItem
              onClick={(event) => {
                handleZoom(event, defaultFontSize);
              }}
              disabled={fontSize === defaultFontSize}
            >
              <RestartAlt /> Zoom Reset
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={(event) => {
                handleProjectUpDown(event, true);
              }}
              disabled={isFirstProject}
            >
              <VerticalAlignTop /> Move Up
            </MenuItem>
            <MenuItem
              onClick={(event) => {
                handleProjectUpDown(event, false);
              }}
              disabled={isLastProject}
            >
              <VerticalAlignBottom /> Move Down
            </MenuItem>
          </Menu>
        </div>
      </div>
      <p className="text" style={{ fontSize }}>
        {usfm}
      </p>
    </div>
  );
}

export default VerseDisplay;
