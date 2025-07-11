import { WebViewProps } from '@papi/core';
import papi from '@papi/frontend';
import { useDialogCallback, useLocalizedStrings } from '@papi/frontend/react';
import { Allotment } from 'allotment';
import { Button, Separator, usePromise } from 'platform-bible-react';
import { deepEqual } from 'platform-bible-utils';
import { Fragment, useCallback, useEffect, useMemo } from 'react';
import {
  ProjectInfo,
  REQUIRED_PROJECT_INTERFACES,
  getTextCollectionTitle,
  getTextCollectionTooltip,
} from '../util';
import ChapterView from './components/chapter-view.component';
import VerseDisplay from './components/verse-display.component';

globalThis.webViewComponent = function TextCollectionWebView({
  // Project ID of the project that is focused or undefined if no project selected
  projectId: expandedProjectId = '',
  updateWebViewDefinition,
  useWebViewState,
  useWebViewScrollGroupScrRef,
}: WebViewProps) {
  // Project IDs to show in the text collection
  const [projectIds, setProjectIds] = useWebViewState<string[]>('projectIds', []);

  const selectProjectsTitleKey = '%textCollection_dialog_selectProjectsInTextCollection_title%';
  const selectProjectsPromptKey = '%textCollection_dialog_selectProjectsToShow_prompt%';
  const selectProjectsKey = '%webview_selectProjects%';
  const textCollectionKey = '%textCollection_defaultTitle%';
  const [localizedStrings] = useLocalizedStrings(
    useMemo(
      () => [selectProjectsTitleKey, selectProjectsPromptKey, selectProjectsKey, textCollectionKey],
      [selectProjectsTitleKey, selectProjectsPromptKey, selectProjectsKey, textCollectionKey],
    ),
  );
  const localizedSelectProjectsTitle = localizedStrings[selectProjectsTitleKey];
  const localizedSelectProjectsPrompt = localizedStrings[selectProjectsPromptKey];
  const localizedSelectProjects = localizedStrings[selectProjectsKey];
  const localizedTextCollection = localizedStrings[textCollectionKey];

  // Project info to show in the text collection - each entry is the info or undefined if
  // not fetched yet
  const [projectsInfo] = usePromise<(ProjectInfo | undefined)[]>(
    useCallback(async () => {
      const infoPromises = projectIds.map(async (projectId) => {
        const pdp = await papi.projectDataProviders.get('platform.base', projectId);

        const name = await pdp.getSetting('platform.name');

        // Using || to make sure we get default if it is an empty string or if it is undefined
        const textDirection = (await pdp.getSetting('platform.textDirection')) || 'ltr';

        return { id: projectId, name, textDirection };
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
  const [verseRef] = useWebViewScrollGroupScrRef();

  // Keep the title up-to-date
  useEffect(() => {
    const projectNames = projectsInfo.map((projectInfo) => projectInfo?.name);
    const newTitle = getTextCollectionTitle(projectNames, verseRef);
    const newTooltip = getTextCollectionTooltip(localizedTextCollection, projectNames);
    if (newTitle || newTooltip) updateWebViewDefinition({ title: newTitle, tooltip: newTooltip });
  }, [localizedTextCollection, updateWebViewDefinition, projectsInfo, verseRef]);

  const selectProjects = useDialogCallback(
    'platform.selectMultipleProjects',
    useMemo(
      () => ({
        title: localizedSelectProjectsTitle,
        prompt: localizedSelectProjectsPrompt,
        selectedProjectIds: projectIds,
        includeProjectInterfaces: [REQUIRED_PROJECT_INTERFACES],
      }),
      [localizedSelectProjectsTitle, localizedSelectProjectsPrompt, projectIds],
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
              {!isLastProject && <Separator />}
            </Fragment>
          );
        })}
      <Button
        title={localizedSelectProjects}
        size="icon"
        variant="ghost"
        className="select-projects-button"
        onClick={() => selectProjects()}
      >
        +
      </Button>
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
