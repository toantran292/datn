import { DEFAULT_PROJECT_FORM_VALUES } from "@unified-teamspace/constants";
import { observer } from "mobx-react";
import { FC, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import ProjectCommonAttributes from "./common-attributes";
import { usePlatformOS } from "@unified-teamspace/hooks";
import ProjectCreateButtons from "./project-create-buttons";
import { useProject } from "@/core/hooks/store/use-project";
import { setToast, TOAST_TYPE } from "@unified-teamspace/ui";

export type TCreateProjectFormProps = {
  setToFavorite?: boolean;
  workspaceSlug: string;
  onClose: () => void;
  handleNextStep: (projectId: string) => void;
  data?: Partial<any>;
  templateId?: string;
  updateCoverImageStatus: (projectId: string, coverImage: string) => Promise<void>;
};

export const CreateProjectForm: FC<TCreateProjectFormProps> = observer((props) => {
  const { data, setToFavorite, workspaceSlug, onClose, handleNextStep, templateId, updateCoverImageStatus } = props;

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
      })
      .catch((err) => {
        console.log({ err });
        try {
          // Handle the new error format where codes are nested in arrays under field names
          const errorData = err?.data ?? {};

          const nameError = errorData.name?.includes("PROJECT_NAME_ALREADY_EXIST");
          const identifierError = errorData?.identifier?.includes("PROJECT_IDENTIFIER_ALREADY_EXIST");

          if (nameError || identifierError) {
            if (nameError) {
              console.log("check");
              setToast({
                type: TOAST_TYPE.ERROR,
                title: "Error",
                message: "Project name already taken",
              });
            }

            if (identifierError) {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: "Error",
                message: "Project identifier already taken",
              });
            }
          } else {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error",
              message: "Something went wrong",
            });
          }
        } catch (error) {
          // Fallback error handling if the error processing fails
          console.error("Error processing API error:", error);
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error",
            message: "Something went wrong",
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
      <h1 className="px-5 py-9 text-custom-primary-200">Create Project</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="px-3">
        <div className="mt-9 space-y-6 pb-5">
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
