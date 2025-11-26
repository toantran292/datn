import { FC, useState } from "react";
import { observer } from "mobx-react";
import { FormProvider, useForm } from "react-hook-form";
import { DEFAULT_PROJECT_FORM_VALUES } from "@uts/constants";
import { setToast, TOAST_TYPE } from "@uts/design-system/ui";
import { usePlatformOS } from "@uts/hooks";
import { useProject } from "@/core/hooks/store/use-project";
import ProjectCommonAttributes from "./common-attributes";
import ProjectCreateButtons from "./project-create-buttons";

export type TCreateProjectFormProps = {
  setToFavorite?: boolean;
  workspaceSlug: string;
  onClose: () => void;
  handleNextStep: (projectId: string) => void;
  data?: Partial<any>;
  templateId?: string;
  updateCoverImageStatus: (projectId: string, coverImage: string) => Promise<void>;
  onSuccess?: () => void;
};

export const CreateProjectForm: FC<TCreateProjectFormProps> = observer((props) => {
  const { data, setToFavorite, workspaceSlug, onClose, handleNextStep, templateId, updateCoverImageStatus, onSuccess } =
    props;

  const { createProject } = useProject();

  const [isChangeInIdentifierRequired, setIsChangeInIdentifierRequired] = useState(true);

  const methods = useForm<any>({
    defaultValues: { ...DEFAULT_PROJECT_FORM_VALUES, ...data },
    reValidateMode: "onChange",
  });

  const { handleSubmit, reset, setValue } = methods;
  const { isMobile } = usePlatformOS();

  const onSubmit = async (formData: Partial<any>) => {
    // Upper case identifier
    formData.identifier = formData.identifier?.toUpperCase();

    const payload = {
      name: formData.name,
      identifier: formData.identifier,
      orgId: workspaceSlug,
    };

    return createProject(workspaceSlug.toString(), payload)
      .then(async (res) => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success",
          message: "Project created successfully",
        });
        onSuccess?.();
        onClose();
      })
      .catch((err) => {
        try {
          const errorData = err?.data ?? {};

          // Check if error message contains specific keywords
          const nameError =
            errorData.name &&
            (typeof errorData.name === "string"
              ? errorData.name.toLowerCase().includes("already exist")
              : errorData.name?.includes?.("PROJECT_NAME_ALREADY_EXIST"));

          const identifierError =
            errorData.identifier &&
            (typeof errorData.identifier === "string"
              ? errorData.identifier.toLowerCase().includes("already exist")
              : errorData.identifier?.includes?.("PROJECT_IDENTIFIER_ALREADY_EXIST"));

          if (nameError) {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Lỗi",
              message: "Tên dự án đã tồn tại",
            });
          } else if (identifierError) {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Lỗi",
              message: "Mã dự án đã tồn tại",
            });
          } else {
            // Display the actual error message from backend if available
            const errorMessage = Object.values(errorData)[0] || "Đã xảy ra lỗi";
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Lỗi",
              message: typeof errorMessage === "string" ? errorMessage : "Đã xảy ra lỗi",
            });
          }
        } catch (error) {
          console.error("Error processing API error:", error);
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Lỗi",
            message: "Đã xảy ra lỗi",
          });
        }
      });
  };

  const handleClose = () => {
    onClose();
    setIsChangeInIdentifierRequired(true);
    setTimeout(() => {
      reset();
    }, 300);
  };

  return (
    <FormProvider {...methods}>
      {/* <ProjectCreateHeader handleClose={handleClose} isMobile={isMobile} /> */}
      <h1 className="px-5 pt-4 text-custom-primary-200">Create Project</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="px-3">
        <div className="mt-6 space-y-6 pb-5">
          <ProjectCommonAttributes
            setValue={setValue}
            isMobile={isMobile}
            isChangeInIdentifierRequired={isChangeInIdentifierRequired}
            setIsChangeInIdentifierRequired={setIsChangeInIdentifierRequired}
          />
          {/* <ProjectAttributes isMobile={isMobile} /> */}
        </div>
        <ProjectCreateButtons handleClose={handleClose} />
      </form>
    </FormProvider>
  );
});
