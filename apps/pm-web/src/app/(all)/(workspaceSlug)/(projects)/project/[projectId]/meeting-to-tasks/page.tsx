"use client";

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import {
  Video,
  Upload,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Check,
  RefreshCw,
} from "lucide-react";
import { setToast, TOAST_TYPE, Button } from "@uts/design-system/ui";
import { useProject } from "@/core/hooks/store/use-project";
import { ProjectTabs } from "@/core/components/project/project-tabs";
import { MeetingUpload } from "./_components/meeting-upload";
import { TasksPreviewList } from "./_components/tasks-preview-list";
import { CreationProgress } from "./_components/creation-progress";
import { CreationResult } from "./_components/creation-result";
import { AnalyzeMeetingResponse, BulkCreateTasksResponse, TaskPreview } from "./types";

type ViewState = "upload" | "preview" | "creating" | "result";
type WorkflowStep = 1 | 2 | 3;

const WORKFLOW_STEPS = [
  { step: 1, title: "Upload", icon: Upload, description: "Upload meeting hoặc transcript" },
  { step: 2, title: "Xem lại", icon: CheckCircle2, description: "Review và chỉnh sửa tasks" },
  { step: 3, title: "Tạo Tasks", icon: Check, description: "Tạo tất cả tasks" },
];

const MeetingToTasksPage = observer(() => {
  const params = useParams<{ workspaceSlug?: string | string[]; projectId?: string | string[] }>();
  const projectIdParam = params?.projectId;
  const workspaceSlugParam = params?.workspaceSlug;
  const projectId = Array.isArray(projectIdParam) ? (projectIdParam[0] ?? "") : (projectIdParam ?? "");
  const workspaceSlug = Array.isArray(workspaceSlugParam) ? (workspaceSlugParam[0] ?? "") : (workspaceSlugParam ?? "");

  const projectStore = useProject();

  const [viewState, setViewState] = useState<ViewState>("upload");
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(1);
  const [meetingData, setMeetingData] = useState<AnalyzeMeetingResponse | null>(null);
  const [tasks, setTasks] = useState<TaskPreview[]>([]);
  const [creationResult, setCreationResult] = useState<BulkCreateTasksResponse | null>(null);

  const project = projectId ? projectStore.getPartialProjectById(projectId) : undefined;

  useEffect(() => {
    if (!projectId) return;
    if (!projectStore.fetchStatus) {
      projectStore.fetchPartialProjects(workspaceSlug).catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Lỗi",
          message: "Không thể tải dự án",
        })
      );
    }
  }, [projectId, projectStore, workspaceSlug]);

  const handleAnalysisComplete = (data: AnalyzeMeetingResponse) => {
    setMeetingData(data);
    setTasks(data.tasks);
    setViewState("preview");
    setCurrentStep(2);

    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: "Đã phân tích meeting",
      message: `Tìm thấy ${data.tasks.length} action items. Vui lòng xem lại.`,
    });
  };

  const handleCreateTasks = async () => {
    if (!meetingData) return;

    setViewState("creating");
    setCurrentStep(3);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/meetings/${meetingData.meetingId}/create-tasks`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId,
            tasks: tasks.map((task) => ({
              title: task.title,
              description: task.description,
              type: task.type,
              priority: task.priority,
              order: task.order,
              estimatedPoints: task.estimatedPoints,
              assigneeId: task.assigneeId,
              dependencies: task.dependencies,
              context: task.context,
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create tasks");
      }

      const result: BulkCreateTasksResponse = await response.json();
      setCreationResult(result);
      setViewState("result");

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Tạo tasks thành công",
        message: `Đã tạo ${result.stats.created} / ${result.stats.total} tasks`,
      });
    } catch (error) {
      console.error("Error creating tasks:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi",
        message: "Không thể tạo tasks. Vui lòng thử lại.",
      });
      setViewState("preview");
      setCurrentStep(2);
    }
  };

  const handleReset = () => {
    setViewState("upload");
    setCurrentStep(1);
    setMeetingData(null);
    setTasks([]);
    setCreationResult(null);
  };

  if (!projectId) {
    return null;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-shrink-0 space-y-6 p-6 pb-0">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-custom-text-300">Dự án</p>
              <h1 className="text-2xl font-semibold text-custom-text-100">
                {project?.name ?? "Meeting to Tasks"}
              </h1>
              <p className="text-sm text-custom-text-300">
                Chuyển đổi meeting thành action items tự động với AI
              </p>
            </div>
          </div>
          <ProjectTabs workspaceSlug={workspaceSlug} projectId={projectId} active="meeting-to-tasks" />
        </header>

        {/* Progress Steps */}
        <div className="flex justify-center px-6">
          <div className="flex items-center justify-between w-full max-w-3xl ml-[68px]">
            {WORKFLOW_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.step;
              const isCompleted = currentStep > step.step;
              const isLast = index === WORKFLOW_STEPS.length - 1;

              return (
                <div key={step.step} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex size-12 items-center justify-center rounded-full border-2 transition-all ${
                        isCompleted
                          ? "border-green-500 bg-green-500 text-white"
                          : isActive
                            ? "border-custom-primary-100 bg-custom-primary-100 text-white"
                            : "border-custom-border-300 bg-custom-background-100 text-custom-text-300"
                      }`}
                    >
                      {isCompleted ? <Check className="size-5" /> : <Icon className="size-5" />}
                    </div>
                    <div className="mt-2 text-center">
                      <p
                        className={`text-sm font-medium ${isActive ? "text-custom-text-100" : "text-custom-text-300"}`}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-custom-text-400">{step.description}</p>
                    </div>
                  </div>
                  {!isLast && (
                    <div className={`mx-4 h-0.5 flex-1 ${isCompleted ? "bg-green-500" : "bg-custom-border-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden p-6 pt-6">
        <div className="flex w-full justify-center">
          <div className="w-full max-w-3xl overflow-y-auto">
            {viewState === "upload" && (
              <div className="space-y-6">
                <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-gradient-to-br from-custom-primary-100 to-purple-500 grid place-items-center">
                      <Video className="size-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-custom-text-100">Bước 1: Upload Meeting</h2>
                      <p className="text-sm text-custom-text-300">
                        Upload video/audio hoặc paste transcript để AI phân tích
                      </p>
                    </div>
                  </div>

                  <MeetingUpload
                    projectId={projectId}
                    workspaceSlug={workspaceSlug}
                    onAnalysisComplete={handleAnalysisComplete}
                  />
                </div>
              </div>
            )}

            {viewState === "preview" && meetingData && (
              <div className="space-y-6">
                <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 grid place-items-center">
                        <CheckCircle2 className="size-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-custom-text-100">
                          Bước 2: Xem lại {meetingData.stats.totalTasks} Tasks
                        </h2>
                        <p className="text-sm text-custom-text-300">
                          Tổng {meetingData.stats.totalPoints} story points - Review và chỉnh sửa nếu cần
                        </p>
                      </div>
                    </div>
                    <Button variant="neutral-primary" size="sm" onClick={handleReset}>
                      <ArrowLeft className="size-4" />
                      Quay lại
                    </Button>
                  </div>

                  <div className="mb-6 rounded-xl border border-custom-border-200 bg-custom-background-90 p-6">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-500">
                          {meetingData.stats.byPriority.urgent}
                        </div>
                        <p className="text-xs text-custom-text-400 mt-1">Urgent</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-500">
                          {meetingData.stats.byPriority.high}
                        </div>
                        <p className="text-xs text-custom-text-400 mt-1">High</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-500">
                          {meetingData.stats.byPriority.medium}
                        </div>
                        <p className="text-xs text-custom-text-400 mt-1">Medium</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-400">
                          {meetingData.stats.byPriority.low}
                        </div>
                        <p className="text-xs text-custom-text-400 mt-1">Low</p>
                      </div>
                    </div>
                  </div>

                  <TasksPreviewList
                    tasks={tasks}
                    onTasksChange={setTasks}
                    transcript={meetingData.transcript}
                    projectId={projectId}
                    workspaceSlug={workspaceSlug}
                  />

                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleCreateTasks}
                    disabled={tasks.length === 0}
                    className="w-full mt-6"
                  >
                    <Check className="size-4" />
                    Tạo tất cả {tasks.length} Tasks
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {viewState === "creating" && (
              <div className="space-y-6">
                <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 grid place-items-center">
                      <Check className="size-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-custom-text-100">Bước 3: Đang tạo Tasks</h2>
                      <p className="text-sm text-custom-text-300">Vui lòng đợi...</p>
                    </div>
                  </div>
                  <CreationProgress tasksCount={tasks.length} />
                </div>
              </div>
            )}

            {viewState === "result" && creationResult && (
              <div className="space-y-6">
                <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-6">
                  <CreationResult
                    result={creationResult}
                    onReset={handleReset}
                    projectId={projectId}
                    workspaceSlug={workspaceSlug}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default MeetingToTasksPage;
