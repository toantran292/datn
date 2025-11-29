import { redirect } from "next/navigation";

type Props = {
  params: {
    projectId: string;
  };
};

export default function ProjectIndexPage({ params }: Props) {
  const { projectId } = params;
  redirect(`/project/${projectId}/backlog`);
}
