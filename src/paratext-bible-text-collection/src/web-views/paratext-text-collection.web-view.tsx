import papi from '@papi/frontend';
import { useDialogCallback } from '@papi/frontend/react';
import { Fragment, useCallback, useEffect, useMemo } from 'react';
import { IconButton, ScriptureReference, usePromise } from 'platform-bible-react';
import { deepEqual } from 'platform-bible-utils';
import { VerseRef } from '@sillsdev/scripture';
import { WebViewProps } from '@papi/core';
import { Divider } from '@mui/material';
import { Allotment } from 'allotment';
import {
  ProjectInfo,
  REQUIRED_PROJECT_INTERFACES,
  getTextCollectionTitle,
  getTextCollectionTooltip,
} from '../util';
import VerseDisplay from './components/verse-display.component';
import ChapterView from './components/chapter-view.component';

/** Transforms a ScriptureReference into a VerseRef */
const getResourceVerseRef = (scrRef: ScriptureReference) => {
  let resourceVerseRef: VerseRef;
  if (scrRef) {
    resourceVerseRef = new VerseRef(scrRef.bookNum, scrRef.chapterNum, scrRef.verseNum);
  } else {
    resourceVerseRef = new VerseRef(1, 1, 1);
  }
  return resourceVerseRef;
};

globalThis.webViewComponent = function TextCollectionWebView({
  // Project ID of the project that is focused or undefined if no project selected
  projectId: expandedProjectId = '',
  updateWebViewDefinition,
  useWebViewState,
  useWebViewScrollGroupScrRef,
}: WebViewProps) {
  // Project IDs to show in the text collection
  const [projectIds, setProjectIds] = useWebViewState<string[]>('projectIds', []);

  // Project info to show in the text collection - each entry is the info or undefined if
  // not fetched yet
  const [projectsInfo] = usePromise<(ProjectInfo | undefined)[]>(
    useCallback(async () => {
      const infoPromises = projectIds.map(async (projectId) => {
        const pdp = await papi.projectDataProviders.get('platform.base', projectId);

        const name = await pdp.getSetting('platform.name');

        return { id: projectId, name };
      });
      return Promise.all(infoPromises);
    }, [projectIds]),
    useMemo(() => projectIds.map(() => undefined), [projectIds]),
  );

  // Reset the expanded project ID if it is no longer available as a choice
  useEffect(() => {
    if (!projectIds.includes(expandedProjectId)) updateWebViewDefinition({ projectId: '' });
  }, [projectIds, expandedProjectId, updateWebViewDefinition]);

  // Current verse reference
  const [scrRef] = useWebViewScrollGroupScrRef();
  const verseRef = useMemo(() => getResourceVerseRef(scrRef), [scrRef]);

  // Keep the title up-to-date
  useEffect(() => {
    const projectNames = projectsInfo.map((projectInfo) => projectInfo?.name);
    const newTitle = getTextCollectionTitle(projectNames, verseRef);
    const newTooltip = getTextCollectionTooltip(projectNames);
    if (newTitle || newTooltip)
      updateWebViewDefinition({
        title: newTitle,
        tooltip: newTooltip,
      });
  }, [updateWebViewDefinition, projectsInfo, verseRef]);

  const selectProjects = useDialogCallback(
    'platform.selectMultipleProjects',
    useMemo(
      () => ({
        title: 'Select projects in Text Collection',
        prompt: 'Please select projects to show in the text collection:',
        selectedProjectIds: projectIds,
        includeProjectInterfaces: [REQUIRED_PROJECT_INTERFACES],
      }),
      [projectIds],
    ),
    useCallback(
      (selectedProjectIds) => {
        // Update the selected project ids
        if (
          selectedProjectIds &&
          !deepEqual([...selectedProjectIds].sort(), [...projectIds].sort())
        )
          setProjectIds(selectedProjectIds);
      },
      [projectIds, setProjectIds],
    ),
  );

  const moveProjectUpDownHandler = (directionUp: boolean, projectId: string) => {
    const projectIdsCopy = [...projectIds];
    const index = projectIdsCopy.findIndex((pid) => pid === projectId);
    const newIndex = directionUp ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex > projectIdsCopy.length - 1) return;
    [projectIdsCopy[index], projectIdsCopy[newIndex]] = [
      projectIdsCopy[newIndex],
      projectIdsCopy[index],
    ];
    setProjectIds(projectIdsCopy);
  };

  const closeProjectHandler = (projectId: string) => {
    const projectIdsCopy = [...projectIds];
    const index = projectIdsCopy.indexOf(projectId, 0);
    if (index > -1) {
      projectIdsCopy.splice(index, 1);
    }
    setProjectIds(projectIdsCopy);
  };

  const verseView = (
    <div className="verse-view">
      {projectIds.length > 0 &&
        projectIds.map((projectId, i) => {
          const isFirstProject = i === 0;
          const isLastProject = i === projectIds.length - 1;
          const projectInfo = projectsInfo.find((info) => info?.id === projectId);

          return (
            <Fragment key={projectId}>
              <VerseDisplay
                projectId={projectId}
                projectInfo={projectInfo}
                selectedProjectId={expandedProjectId}
                selectProjectId={(pId) => updateWebViewDefinition({ projectId: pId })}
                verseRef={verseRef}
                isFirstProject={isFirstProject}
                isLastProject={isLastProject}
                onMoveUpDown={moveProjectUpDownHandler}
                onCloseProject={closeProjectHandler}
                isSelected={projectId === expandedProjectId}
                useWebViewState={useWebViewState}
              />
              {!isLastProject && <Divider />}
            </Fragment>
          );
        })}
      <IconButton
        label="Select projects"
        size="medium"
        className="select-projects-button"
        onClick={() => selectProjects()}
      >
        +
      </IconButton>
    </div>
  );

  const showFullChapter = expandedProjectId && expandedProjectId.length > 0;

  return (
    <div className="text-collection">
      <Allotment>
        {verseView}
        {showFullChapter && (
          <ChapterView
            projectId={expandedProjectId}
            projectInfo={projectsInfo.find((metadata) => metadata?.id === expandedProjectId)}
            verseRef={verseRef}
          />
        )}
      </Allotment>
    </div>
  );
};
