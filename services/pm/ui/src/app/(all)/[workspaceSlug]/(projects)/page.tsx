"use client";

import { observer } from "mobx-react";

const WorkspaceDashboardPage = observer(() => {
  //   const { currentWorkspace } = useWorkspace();
  //   const { t } = useTranslation();
  //   derived values
  //   const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - ${t("home.title")}` : undefined;

  return (
    <>
      {/* <AppHeader header={<WorkspaceDashboardHeader />} />
      <ContentWrapper>
        <PageHead title={pageTitle} />
        <WorkspaceHomeView />
      </ContentWrapper> */}
      children
    </>
  );
});

export default WorkspaceDashboardPage;
