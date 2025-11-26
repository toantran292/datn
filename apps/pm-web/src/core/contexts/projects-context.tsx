"use client";

import React, { createContext, useContext, useMemo } from "react";
import { TPartialProject } from "@uts/types";
import { useProjects } from "@/core/hooks/use-projects";

type ProjectsContextType = {
  projects: TPartialProject[];
  projectMap: Record<string, TPartialProject>;
  isLoading: boolean;
  error: any;
  mutate: () => Promise<TPartialProject[] | undefined>;
  getProjectById: (projectId: string) => TPartialProject | undefined;
};

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { projects, isLoading, error, mutate } = useProjects();

  const projectMap = useMemo(() => {
    const map: Record<string, TPartialProject> = {};
    projects.forEach((project) => {
      map[project.id] = project;
    });
    return map;
  }, [projects]);

  const getProjectById = (projectId: string) => projectMap[projectId];

  const value = {
    projects,
    projectMap,
    isLoading,
    error,
    mutate,
    getProjectById,
  };

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
};

export const useProjectsContext = () => {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error("useProjectsContext must be used within ProjectsProvider");
  }
  return context;
};

