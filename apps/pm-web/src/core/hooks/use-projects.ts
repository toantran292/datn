import useSWR from "swr";
import { TPartialProject } from "@uts/types";
import { TOAST_TYPE, setToast } from "@uts/design-system/ui";
import { ProjectService } from "@/core/services/project";

const projectService = new ProjectService();

export const useProjects = () => {
  const { data, error, isLoading, mutate } = useSWR<TPartialProject[]>(
    "/api/projects",
    () => projectService.getProjectsLite(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      onError: (error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Lỗi",
          message: "Không thể tải danh sách dự án",
        });
      },
    }
  );

  return {
    projects: data ?? [],
    isLoading,
    error,
    mutate,
  };
};
