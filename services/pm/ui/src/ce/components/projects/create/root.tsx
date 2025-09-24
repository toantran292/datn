import { DEFAULT_PROJECT_FORM_VALUES } from "@unified-teamspace/constants";
import { observer } from "mobx-react";
import { FC } from "react";
import { FormProvider, useForm } from "react-hook-form";

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

  const methods = useForm<any>({
    defaultValues: { ...DEFAULT_PROJECT_FORM_VALUES, ...data },
    reValidateMode: "onChange",
  });

  const { handleSubmit, reset, setValue } = methods;

  const onSubmit = async (formData: Partial<any>) => {
    // Upper case identifier
    formData.identifier = formData.identifier?.toUpperCase();
  };

  return (
    <FormProvider {...methods}>
      <div className="bg-white border border-gray-300 rounded-lg p-6 min-h-[300px]">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Create Project</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="px-3">
          <div className="mt-9 space-y-6 pb-5">
            <div className="text-gray-700">project common attributes</div>
            <div className="text-gray-700">attributes</div>
          </div>
          <div className="text-gray-700">button</div>
        </form>
      </div>
    </FormProvider>
  );
});
