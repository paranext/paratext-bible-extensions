import papi from '@papi/frontend';
import { useSetting, useDialogCallback } from '@papi/frontend/react';
import { Fragment, useCallback, useEffect, useMemo } from 'react';
import { IconButton, ScriptureReference, usePromise } from 'platform-bible-react';
import { deepEqual } from 'platform-bible-utils';
import { VerseRef } from '@sillsdev/scripture';
import { ProjectMetadata, WebViewProps } from '@papi/core';
import { Divider } from '@mui/material';
import { Allotment } from 'allotment';
import { getTextCollectionTitle, getTextCollectionTooltip } from '../util';
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

const defaultScrRef: ScriptureReference = { bookNum: 1, chapterNum: 1, verseNum: 1 };

globalThis.webViewComponent = function TextCollectionWebView({
  // Project ID of the project that is focused or undefined if no project selected
  projectId: expandedProjectId = '',
  // Project IDs to show in the text collection
  projectIds = [],
  updateWebViewDefinition,
  useWebViewState,
}: WebViewProps) {
  // Project metadata to show in the text collection - each entry is the metadata or undefined if
  // not fetched yet
  const [projectsMetadata] = usePromise<(ProjectMetadata | undefined)[]>(
    useCallback(async () => {
      const metadataPromises = projectIds.map((projectId) =>
        papi.projectLookup.getMetadataForProject(projectId),
      );
      return Promise.all(metadataPromises);
    }, [projectIds]),
    useMemo(() => projectIds.map(() => undefined), [projectIds]),
  );

  // Reset the expanded project ID if it is no longer available as a choice
  useEffect(() => {
    if (!projectIds.includes(expandedProjectId)) updateWebViewDefinition({ projectId: '' });
  }, [projectIds, expandedProjectId, updateWebViewDefinition]);

  // Current verse reference
  const [scrRef] = useSetting('platform.verseRef', defaultScrRef);
  const verseRef = useMemo(() => getResourceVerseRef(scrRef), [scrRef]);

  // Keep the title up-to-date
  useEffect(() => {
    const newTitle = getTextCollectionTitle(projectsMetadata, verseRef);
    const newTooltip = getTextCollectionTooltip(projectsMetadata);
    if (newTitle || newTooltip)
      updateWebViewDefinition({
        title: newTitle,
        tooltip: newTooltip,
      });
  }, [updateWebViewDefinition, projectsMetadata, verseRef]);

  const selectProjects = useDialogCallback(
    'platform.selectMultipleProjects',
    useMemo(
      () => ({
        title: 'Select projects in Text Collection',
        prompt: 'Please select projects to show in the text collection:',
        selectedProjectIds: projectIds,
        includeProjectTypes: '^ParatextStandard$',
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
          updateWebViewDefinition({ projectIds: selectedProjectIds });
      },
      [projectIds, updateWebViewDefinition],
    ),
  );

  const moveProjectUpDownHandler = (directionUp: boolean, projectId: string) => {
    const projectIdsCopy = [...projectIds];
    const index = projectIdsCopy.findIndex((id) => id === projectId);
    const newIndex = directionUp ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex > projectIdsCopy.length - 1) return;
    [projectIdsCopy[index], projectIdsCopy[newIndex]] = [
      projectIdsCopy[newIndex],
      projectIdsCopy[index],
    ];
    updateWebViewDefinition({ projectIds: projectIdsCopy });
  };

  const closeProjectHandler = (projectId: string) => {
    const projectIdsCopy = [...projectIds];
    const index = projectIdsCopy.indexOf(projectId, 0);
    if (index > -1) {
      projectIdsCopy.splice(index, 1);
    }
    updateWebViewDefinition({ projectIds: projectIdsCopy });
  };

  const verseView = (
    <div className="verse-view">
      {projectIds.length > 0 &&
        projectIds.map((projectId, i) => {
          const isFirstProject = i === 0;
          const isLastProject = i === projectIds.length - 1;
          const projectMetadata = projectsMetadata.find((metadata) => metadata?.id === projectId);

          return (
            <Fragment key={projectId}>
              <VerseDisplay
                projectId={projectId}
                projectMetadata={projectMetadata}
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
            projectMetadata={projectsMetadata.find(
              (metadata) => metadata?.id === expandedProjectId,
            )}
            verseRef={verseRef}
          />
        )}
      </Allotment>
    </div>
  );
};
