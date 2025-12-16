"use client";

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import {
  Sparkles,
  FileText,
  Type,
  Upload,
  Wand2,
  Split,
  Calculator,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Check,
  Edit2,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { setToast, TOAST_TYPE, Button, TextArea } from "@uts/design-system/ui";
import { LiteTextEditorWithRef } from "@uts/design-system/editor";

import { useProject } from "@/core/hooks/store/use-project";
import { useIssue } from "@/core/hooks/store/use-issue";
import { useAIRefineStream } from "@/core/hooks/use-ai-refine-stream";
import { useAIBreakdown } from "@/core/hooks/use-ai-breakdown";
import { useAIEstimate } from "@/core/hooks/use-ai-estimate";
import { ProjectTabs } from "@/core/components/project/project-tabs";
import type { SubTask } from "@/core/types/ai";

type WorkflowStep = 1 | 2 | 3 | 4;

const WORKFLOW_STEPS = [
  { step: 1, title: "Mô tả", icon: FileText, description: "Nhập mô tả công việc" },
  { step: 2, title: "Cải thiện", icon: Wand2, description: "AI refine mô tả" },
  { step: 3, title: "Ước lượng", icon: Calculator, description: "AI estimate points" },
  { step: 4, title: "Phân tích", icon: Split, description: "AI breakdown (optional)" },
];

const AutoCreatePage = observer(() => {
  const params = useParams<{ workspaceSlug?: string | string[]; projectId?: string | string[] }>();
  const projectIdParam = params?.projectId;
  const workspaceSlugParam = params?.workspaceSlug;
  const projectId = Array.isArray(projectIdParam) ? (projectIdParam[0] ?? "") : (projectIdParam ?? "");
  const workspaceSlug = Array.isArray(workspaceSlugParam) ? (workspaceSlugParam[0] ?? "") : (workspaceSlugParam ?? "");

  const projectStore = useProject();
  const issueStore = useIssue();

  // AI Hooks
  const { refine, isRefining, streamedHtml } = useAIRefineStream();
  const { breakdown, isBreakingDown, lastResult: breakdownData } = useAIBreakdown();
  const { estimate, isEstimating, lastResult: estimateData } = useAIEstimate();

  // Workflow State
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(1);
  const [inputMode, setInputMode] = useState<"text" | "file">("text");

  // Form Data
  const [description, setDescription] = useState("");
  const [issueName, setIssueName] = useState("");
  const [issueType, setIssueType] = useState<"STORY" | "BUG" | "TASK" | "EPIC">("STORY");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");

  // Results from each step
  const [refinedDescription, setRefinedDescription] = useState("");
  const [estimatedPoints, setEstimatedPoints] = useState<number | null>(null);
  const [shouldBreakdown, setShouldBreakdown] = useState(false);
  const [isEditingRefined, setIsEditingRefined] = useState(false);

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

  // Update refined description when streaming completes
  useEffect(() => {
    if (streamedHtml && !isRefining) {
      setRefinedDescription(streamedHtml);
    }
  }, [streamedHtml, isRefining]);

  // Update estimated points when estimation completes
  useEffect(() => {
    if (estimateData?.suggestedPoints && !isEstimating) {
      setEstimatedPoints(estimateData.suggestedPoints);
    }
  }, [estimateData, isEstimating]);

  const handleStep1Submit = async () => {
    if (!description.trim() || !issueName.trim()) {
      setToast({
        type: TOAST_TYPE.WARNING,
        title: "Thiếu thông tin",
        message: "Vui lòng nhập tên và mô tả công việc",
      });
      return;
    }

    try {
      await refine({
        issueId: projectId || "temp-id",
        currentDescription: description,
        issueName: issueName,
        issueType: issueType,
        priority: priority,
      });

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Đã cải thiện mô tả",
        message: "Chuyển sang bước ước lượng story points",
      });

      setCurrentStep(2);
    } catch (err) {
      console.error("Failed to refine:", err);
    }
  };

  const handleStep2Submit = async () => {
    if (!refinedDescription) {
      setToast({
        type: TOAST_TYPE.WARNING,
        title: "Thiếu mô tả",
        message: "Vui lòng hoàn thành bước cải thiện mô tả trước",
      });
      return;
    }

    try {
      await estimate({
        issueId: projectId || "temp-id",
        issueName: issueName,
        issueType: issueType,
        priority: priority,
        currentDescription: refinedDescription,
      });

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Đã ước lượng story points",
        message: "Bạn có muốn phân tích thành sub-tasks không?",
      });

      setCurrentStep(3);
    } catch (err) {
      console.error("Failed to estimate:", err);
    }
  };

  const handleStep3Breakdown = async () => {
    if (!refinedDescription) return;

    try {
      setShouldBreakdown(true);
      await breakdown({
        issueId: projectId || "temp-id",
        issueName: issueName,
        issueType: issueType,
        priority: priority,
        currentDescription: refinedDescription,
        constraints: {
          maxSubTasks: 10,
          targetPointsPerTask: 3,
          includeTests: true,
          includeDocs: false,
        },
      });

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Đã phân tích tasks",
        message: "Xem lại và tạo các tasks",
      });

      setCurrentStep(4);
    } catch (err) {
      console.error("Failed to breakdown:", err);
    }
  };

  const handleStep3Skip = () => {
    setShouldBreakdown(false);
    setCurrentStep(4);
  };

  const handleCreateSingleTask = async () => {
    if (!refinedDescription || !projectId || !issueName.trim()) {
      setToast({
        type: TOAST_TYPE.WARNING,
        title: "Thiếu thông tin",
        message: "Vui lòng đảm bảo có đầy đủ thông tin công việc",
      });
      return;
    }

    try {
      // Validate and normalize type to ensure it's one of the allowed values
      const validTypes = ["STORY", "TASK", "BUG", "EPIC"];
      const normalizedType = validTypes.includes(issueType) ? issueType : "STORY";

      const payload: any = {
        projectId: projectId,
        name: issueName,
        type: normalizedType,
        priority: priority,
        assignees: [],
      };

      // Only add optional fields if they have values
      if (refinedDescription) {
        payload.description = refinedDescription;
        payload.descriptionHtml = refinedDescription;
      }
      if (estimatedPoints) {
        payload.point = estimatedPoints;
      }

      console.log("Creating issue with payload:", payload);
      console.log("Original issueType:", issueType, "Normalized:", normalizedType);
      await issueStore.createIssue(payload);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Đã tạo công việc",
        message: "Công việc mới đã được tạo thành công",
      });

      handleReset();
    } catch (err) {
      console.error("Error creating issue:", err);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi",
        message: err instanceof Error ? err.message : "Không thể tạo công việc. Vui lòng thử lại.",
      });
    }
  };

  const handleCreateTasks = async () => {
    if (!breakdownData?.subTasks || !projectId) return;

    try {
      for (const task of breakdownData.subTasks) {
        // Validate and normalize type
        const validTypes = ["STORY", "TASK", "BUG", "EPIC"];
        const normalizedType = validTypes.includes(task.taskType) ? task.taskType : "TASK";

        const payload: any = {
          projectId: projectId,
          name: task.name,
          type: normalizedType,
          priority: task.priority,
          assignees: [],
        };

        // Only add optional fields if they have values
        if (task.description) {
          payload.description = task.description;
          payload.descriptionHtml = task.descriptionHtml || task.description;
        }
        if (task.estimatedPoints) {
          payload.point = task.estimatedPoints;
        }

        console.log("Creating sub-task with payload:", payload);
        console.log("Original taskType:", task.taskType, "Normalized:", normalizedType);
        await issueStore.createIssue(payload);
      }

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Đã tạo tasks",
        message: `Đã tạo thành công ${breakdownData.subTasks.length} công việc`,
      });

      handleReset();
    } catch (err) {
      console.error("Error creating tasks:", err);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi",
        message: err instanceof Error ? err.message : "Không thể tạo tasks. Vui lòng thử lại.",
      });
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setDescription("");
    setIssueName("");
    setIssueType("STORY");
    setPriority("MEDIUM");
    setRefinedDescription("");
    setEstimatedPoints(null);
    setShouldBreakdown(false);
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
                {project?.name ?? "Tự động tạo công việc"}
              </h1>
              <p className="text-sm text-custom-text-300">
                Quy trình tạo công việc tự động với AI - từ mô tả đến phân tích chi tiết
              </p>
            </div>
          </div>
          <ProjectTabs workspaceSlug={workspaceSlug} projectId={projectId} active="auto-create" />
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
          {/* Main Content */}
          <div className="w-full max-w-3xl overflow-y-auto">
            {/* Step 1: Input Description */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-gradient-to-br from-custom-primary-100 to-purple-500 grid place-items-center">
                      <Sparkles className="size-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-custom-text-100">Bước 1: Nhập mô tả công việc</h2>
                      <p className="text-sm text-custom-text-300">AI sẽ cải thiện và tạo mô tả chi tiết cho bạn</p>
                    </div>
                  </div>

                  <div className="mb-6 flex gap-2 rounded-lg border border-custom-border-200 bg-custom-background-90 p-1">
                    <button
                      onClick={() => setInputMode("text")}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                        inputMode === "text"
                          ? "bg-custom-background-100 text-custom-text-100 shadow-sm"
                          : "text-custom-text-300 hover:text-custom-text-200"
                      }`}
                    >
                      <Type className="size-4" />
                      Text Input
                    </button>
                    <button
                      onClick={() => setInputMode("file")}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                        inputMode === "file"
                          ? "bg-custom-background-100 text-custom-text-100 shadow-sm"
                          : "text-custom-text-300 hover:text-custom-text-200"
                      }`}
                    >
                      <Upload className="size-4" />
                      File Upload
                    </button>
                  </div>

                  {inputMode === "text" ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-custom-text-200">Tên công việc</label>
                        <input
                          type="text"
                          value={issueName}
                          onChange={(e) => setIssueName(e.target.value)}
                          placeholder="Ví dụ: Tích hợp Google OAuth"
                          className="w-full rounded-md border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm text-custom-text-100 placeholder-custom-text-400 focus:border-custom-primary-100 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-custom-text-200">Loại công việc</label>
                          <select
                            value={issueType}
                            onChange={(e) => setIssueType(e.target.value as any)}
                            className="w-full rounded-md border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm text-custom-text-100 focus:border-custom-primary-100 focus:outline-none"
                          >
                            <option value="STORY">Story</option>
                            <option value="TASK">Task</option>
                            <option value="BUG">Bug</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-custom-text-200">Độ ưu tiên</label>
                          <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as any)}
                            className="w-full rounded-md border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm text-custom-text-100 focus:border-custom-primary-100 focus:outline-none"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-custom-text-200">Mô tả ngắn gọn</label>
                        <TextArea
                          value={description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                          placeholder="Nhập mô tả ngắn gọn. AI sẽ cải thiện và tạo mô tả chi tiết..."
                          className="min-h-[200px]"
                        />
                        <p className="text-xs text-custom-text-400">{description.length} / 10,000 ký tự</p>
                      </div>

                      <Button
                        variant="primary"
                        size="md"
                        onClick={handleStep1Submit}
                        disabled={isRefining || !description.trim() || !issueName.trim()}
                        className="w-full"
                      >
                        {isRefining ? (
                          <>
                            <Sparkles className="size-4 animate-spin" />
                            Đang cải thiện mô tả...
                          </>
                        ) : (
                          <>
                            <Wand2 className="size-4" />
                            Cải thiện mô tả với AI
                            <ArrowRight className="size-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-lg border-2 border-dashed border-custom-border-300 bg-custom-background-90 p-12 text-center">
                        <FileText className="size-12 mx-auto mb-4 text-custom-text-300" />
                        <p className="text-sm font-medium text-custom-text-200 mb-1">Upload file tài liệu</p>
                        <p className="text-xs text-custom-text-400 mb-4">Hỗ trợ PDF, Word, Excel (Coming soon)</p>
                        <Button variant="neutral-primary" size="sm" disabled>
                          <Upload className="size-4" />
                          Chọn file
                        </Button>
                      </div>
                      <p className="text-xs text-custom-text-400 text-center">
                        Tính năng upload file đang được phát triển
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Review Refined Description */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 grid place-items-center">
                        <Wand2 className="size-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-custom-text-100">Bước 2: Mô tả đã được cải thiện</h2>
                        <p className="text-sm text-custom-text-300">Xem lại mô tả chi tiết và chuyển sang ước lượng</p>
                      </div>
                    </div>
                    <Button variant="neutral-primary" size="sm" onClick={() => setCurrentStep(1)}>
                      <ArrowLeft className="size-4" />
                      Quay lại
                    </Button>
                  </div>

                  {refinedDescription ? (
                    <>
                      {isEditingRefined ? (
                        <div className="space-y-4 mb-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-custom-text-200">
                              Chỉnh sửa mô tả
                            </label>
                            <div className="border border-custom-border-200 rounded-md">
                              <LiteTextEditorWithRef
                                id="refined-description-editor"
                                initialValue={refinedDescription}
                                value={refinedDescription}
                                fileHandler={{
                                  assetsUploadStatus: {},
                                  upload: async () => "",
                                  delete: async () => {},
                                  restore: async () => {},
                                  cancel: () => {},
                                  checkIfAssetExists: async () => false,
                                  getAssetDownloadSrc: async (path: string) => path,
                                  getAssetSrc: async (path: string) => path,
                                  validation: {
                                    maxFileSize: 5 * 1024 * 1024, // 5MB
                                  },
                                }}
                                mentionHandler={{
                                  renderComponent: () => null,
                                  searchCallback: async () => [],
                                }}
                                disabledExtensions={[]}
                                flaggedExtensions={[]}
                                onChange={(_json: object, html: string) => {
                                  setRefinedDescription(html);
                                }}
                                editable={true}
                                placeholder="Chỉnh sửa mô tả..."
                              />
                            </div>
                            <p className="text-xs text-custom-text-400">
                              Bạn có thể chỉnh sửa nội dung với định dạng rich text
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setIsEditingRefined(false)}
                            >
                              <Save className="size-4" />
                              Lưu thay đổi
                            </Button>
                            <Button
                              variant="neutral-primary"
                              size="sm"
                              onClick={() => {
                                setIsEditingRefined(false);
                                setRefinedDescription(streamedHtml);
                              }}
                            >
                              <X className="size-4" />
                              Hủy
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <div
                              className="prose prose-sm max-w-none dark:prose-invert mb-6 p-4 rounded-md bg-custom-background-90"
                              dangerouslySetInnerHTML={{ __html: refinedDescription }}
                            />
                            <Button
                              variant="neutral-primary"
                              size="sm"
                              onClick={() => setIsEditingRefined(true)}
                              className="absolute top-2 right-2"
                            >
                              <Edit2 className="size-4" />
                              Chỉnh sửa
                            </Button>
                          </div>
                        </>
                      )}

                      {!isEditingRefined && (
                        <Button
                          variant="primary"
                          size="md"
                          onClick={handleStep2Submit}
                          disabled={isEstimating}
                          className="w-full"
                        >
                          {isEstimating ? (
                            <>
                              <Calculator className="size-4 animate-spin" />
                              Đang ước lượng...
                            </>
                          ) : (
                            <>
                              <Calculator className="size-4" />
                              Ước lượng Story Points
                              <ArrowRight className="size-4 ml-2" />
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-sm text-custom-text-300">Đang chờ mô tả được cải thiện...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Estimate Points & Choose Breakdown */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 grid place-items-center">
                        <Calculator className="size-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-custom-text-100">
                          Bước 3: Story Points đã ước lượng
                        </h2>
                        <p className="text-sm text-custom-text-300">Chọn phân tích thành sub-tasks hoặc bỏ qua</p>
                      </div>
                    </div>
                    <Button variant="neutral-primary" size="sm" onClick={() => setCurrentStep(2)}>
                      <ArrowLeft className="size-4" />
                      Quay lại
                    </Button>
                  </div>

                  {estimatedPoints !== null && (
                    <div className="mb-6">
                      <div className="rounded-xl border border-custom-border-200 bg-custom-background-90 p-8 text-center mb-6">
                        <div className="text-6xl font-bold text-custom-primary-100 mb-2">{estimatedPoints}</div>
                        <p className="text-sm text-custom-text-300">Story Points</p>
                        {estimateData?.confidence && (
                          <p className="text-xs text-custom-text-400 mt-2">
                            Confidence: {Math.round(estimateData.confidence * 100)}%
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-medium text-custom-text-200">
                          Bạn có muốn phân tích thành sub-tasks không?
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <Button variant="primary" size="md" onClick={handleStep3Breakdown} disabled={isBreakingDown}>
                            {isBreakingDown ? (
                              <>
                                <Split className="size-4 animate-spin" />
                                Đang phân tích...
                              </>
                            ) : (
                              <>
                                <Split className="size-4" />
                                Có, phân tích tasks
                              </>
                            )}
                          </Button>
                          <Button variant="neutral-primary" size="md" onClick={handleStep3Skip}>
                            Không, bỏ qua
                            <ArrowRight className="size-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Final Review & Create */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 grid place-items-center">
                        <CheckCircle2 className="size-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-custom-text-100">Bước 4: Xác nhận và tạo</h2>
                        <p className="text-sm text-custom-text-300">
                          {shouldBreakdown ? "Tạo các sub-tasks" : "Tạo một task duy nhất"}
                        </p>
                      </div>
                    </div>
                    <Button variant="neutral-primary" size="sm" onClick={() => setCurrentStep(3)}>
                      <ArrowLeft className="size-4" />
                      Quay lại
                    </Button>
                  </div>

                  {shouldBreakdown && breakdownData?.subTasks ? (
                    <>
                      <div className="mb-6 space-y-3">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-medium text-custom-text-200">
                            Danh sách {breakdownData.subTasks.length} sub-tasks
                          </p>
                        </div>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                          {breakdownData.subTasks.map((task: SubTask, index: number) => (
                            <div
                              key={task.tempId}
                              className="rounded-lg border border-custom-border-200 bg-custom-background-90 p-4"
                            >
                              <div className="flex items-start gap-3">
                                <span className="flex size-7 items-center justify-center rounded-full bg-custom-primary-100/10 text-xs font-semibold text-custom-primary-100">
                                  {index + 1}
                                </span>
                                <div className="flex-1 space-y-2">
                                  <h4 className="text-sm font-semibold text-custom-text-100">{task.name}</h4>
                                  <p className="text-xs text-custom-text-300">{task.description}</p>
                                  <div className="flex gap-2">
                                    <span className="rounded bg-custom-background-80 px-2 py-1 text-xs text-custom-text-300">
                                      {task.taskType}
                                    </span>
                                    <span className="rounded bg-custom-background-80 px-2 py-1 text-xs text-custom-text-300">
                                      {task.priority}
                                    </span>
                                    <span className="rounded bg-custom-primary-100/10 px-2 py-1 text-xs font-medium text-custom-primary-100">
                                      {task.estimatedPoints} pts
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button variant="primary" size="md" onClick={handleCreateTasks} className="w-full">
                        <CheckCircle2 className="size-4" />
                        Tạo {breakdownData.subTasks.length} Tasks
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="mb-6 space-y-4 p-4 rounded-md bg-custom-background-90">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-base font-semibold text-custom-text-100 mb-1">{issueName}</h3>
                            <div className="flex gap-2 mb-3">
                              <span className="rounded bg-custom-background-80 px-2 py-1 text-xs text-custom-text-300">
                                {issueType}
                              </span>
                              <span className="rounded bg-custom-background-80 px-2 py-1 text-xs text-custom-text-300">
                                {priority}
                              </span>
                              {estimatedPoints && (
                                <span className="rounded bg-custom-primary-100/10 px-2 py-1 text-xs font-medium text-custom-primary-100">
                                  {estimatedPoints} pts
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div
                          className="prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: refinedDescription }}
                        />
                      </div>
                      <Button variant="primary" size="md" onClick={handleCreateSingleTask} className="w-full">
                        <CheckCircle2 className="size-4" />
                        Tạo Task
                      </Button>
                    </>
                  )}

                  <Button variant="neutral-primary" size="md" onClick={handleReset} className="w-full mt-3">
                    <RefreshCw className="size-4" />
                    Bắt đầu lại
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default AutoCreatePage;
