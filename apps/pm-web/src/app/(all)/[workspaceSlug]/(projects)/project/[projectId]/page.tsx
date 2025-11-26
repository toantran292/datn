import { redirect } from "next/navigation";

type Props = {
  params: {
    workspaceSlug: string;
    projectId: string;
  };
};

export default function ProjectIndexPage({ params }: Props) {
  const { workspaceSlug, projectId } = params;
  redirect(`/${workspaceSlug}/project/${projectId}/backlog`);
}
